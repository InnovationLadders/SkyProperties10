import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NOTIFICATION_CHANNELS, NOTIFICATION_TYPES } from './constants';

const getNotificationSettings = async () => {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'billing'));
    if (settingsDoc.exists()) {
      return settingsDoc.data().notificationSettings || {};
    }
    return {
      smsEnabled: false,
      whatsappEnabled: false,
      emailEnabled: true,
    };
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return {
      smsEnabled: false,
      whatsappEnabled: false,
      emailEnabled: true,
    };
  }
};

const getUserPreferences = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        sms: data.notificationPreferences?.sms ?? true,
        whatsapp: data.notificationPreferences?.whatsapp ?? true,
        email: data.notificationPreferences?.email ?? true,
        phoneNumber: data.phoneNumber,
        email: data.email,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return null;
  }
};

const logNotification = async (notificationData) => {
  try {
    await addDoc(collection(db, 'notificationLogs'), {
      ...notificationData,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error logging notification:', error);
  }
};

const sendSMSNotification = async (phoneNumber, message) => {
  console.log(`[SMS] Sending to ${phoneNumber}: ${message}`);

  return {
    success: true,
    deliveryStatus: 'delivered',
  };
};

const sendWhatsAppNotification = async (phoneNumber, message) => {
  console.log(`[WhatsApp] Sending to ${phoneNumber}: ${message}`);

  return {
    success: true,
    deliveryStatus: 'delivered',
  };
};

const sendEmailNotification = async (email, subject, message) => {
  console.log(`[Email] Sending to ${email}: ${subject} - ${message}`);

  return {
    success: true,
    deliveryStatus: 'delivered',
  };
};

const getNotificationMessage = (type, data, language = 'en') => {
  const messages = {
    [NOTIFICATION_TYPES.BILL_ISSUED]: {
      en: {
        subject: 'New Bill Issued',
        message: `A new bill of ${data.amount} ${data.currency} has been issued. Due date: ${data.dueDate}. Bill Type: ${data.billType}.`,
      },
      ar: {
        subject: 'تم إصدار فاتورة جديدة',
        message: `تم إصدار فاتورة جديدة بقيمة ${data.amount} ${data.currency}. تاريخ الاستحقاق: ${data.dueDate}. نوع الفاتورة: ${data.billType}.`,
      },
    },
    [NOTIFICATION_TYPES.PAYMENT_REMINDER]: {
      en: {
        subject: 'Payment Reminder',
        message: `Reminder: Your bill of ${data.amount} ${data.currency} is due on ${data.dueDate}. Please make payment to avoid late fees.`,
      },
      ar: {
        subject: 'تذكير بالدفع',
        message: `تذكير: فاتورتك بقيمة ${data.amount} ${data.currency} مستحقة في ${data.dueDate}. يرجى الدفع لتجنب رسوم التأخير.`,
      },
    },
    [NOTIFICATION_TYPES.PAYMENT_CONFIRMED]: {
      en: {
        subject: 'Payment Confirmed',
        message: `Your payment of ${data.amount} ${data.currency} has been confirmed. Transaction ID: ${data.transactionId}.`,
      },
      ar: {
        subject: 'تم تأكيد الدفع',
        message: `تم تأكيد دفعتك بقيمة ${data.amount} ${data.currency}. رقم المعاملة: ${data.transactionId}.`,
      },
    },
    [NOTIFICATION_TYPES.PAYMENT_FAILED]: {
      en: {
        subject: 'Payment Failed',
        message: `Your payment of ${data.amount} ${data.currency} has failed. Please try again or contact support.`,
      },
      ar: {
        subject: 'فشل الدفع',
        message: `فشلت دفعتك بقيمة ${data.amount} ${data.currency}. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.`,
      },
    },
    [NOTIFICATION_TYPES.OVERDUE_NOTICE]: {
      en: {
        subject: 'Overdue Payment Notice',
        message: `Your bill of ${data.amount} ${data.currency} is now overdue. Late fees may apply. Please make payment immediately.`,
      },
      ar: {
        subject: 'إشعار بالتأخير في الدفع',
        message: `فاتورتك بقيمة ${data.amount} ${data.currency} متأخرة الآن. قد يتم تطبيق رسوم التأخير. يرجى الدفع فوراً.`,
      },
    },
  };

  return messages[type]?.[language] || messages[type]?.en || { subject: '', message: '' };
};

export const sendBillNotification = async (recipientId, notificationType, billData, language = 'en') => {
  try {
    const settings = await getNotificationSettings();
    const userPrefs = await getUserPreferences(recipientId);

    if (!userPrefs) {
      console.error('User preferences not found');
      return { success: false, error: 'User preferences not found' };
    }

    const { subject, message } = getNotificationMessage(notificationType, billData, language);
    const results = [];

    if (settings.smsEnabled && userPrefs.sms && userPrefs.phoneNumber) {
      const smsResult = await sendSMSNotification(userPrefs.phoneNumber, message);
      results.push({
        channel: NOTIFICATION_CHANNELS.SMS,
        ...smsResult,
      });

      await logNotification({
        recipientId,
        channel: NOTIFICATION_CHANNELS.SMS,
        type: notificationType,
        message,
        deliveryStatus: smsResult.deliveryStatus,
        billId: billData.billId,
      });
    }

    if (settings.whatsappEnabled && userPrefs.whatsapp && userPrefs.phoneNumber) {
      const whatsappResult = await sendWhatsAppNotification(userPrefs.phoneNumber, message);
      results.push({
        channel: NOTIFICATION_CHANNELS.WHATSAPP,
        ...whatsappResult,
      });

      await logNotification({
        recipientId,
        channel: NOTIFICATION_CHANNELS.WHATSAPP,
        type: notificationType,
        message,
        deliveryStatus: whatsappResult.deliveryStatus,
        billId: billData.billId,
      });
    }

    if (settings.emailEnabled && userPrefs.email && userPrefs.email) {
      const emailResult = await sendEmailNotification(userPrefs.email, subject, message);
      results.push({
        channel: NOTIFICATION_CHANNELS.EMAIL,
        ...emailResult,
      });

      await logNotification({
        recipientId,
        channel: NOTIFICATION_CHANNELS.EMAIL,
        type: notificationType,
        message,
        subject,
        deliveryStatus: emailResult.deliveryStatus,
        billId: billData.billId,
      });
    }

    return {
      success: results.some((r) => r.success),
      results,
    };
  } catch (error) {
    console.error('Error sending bill notification:', error);
    return { success: false, error: error.message };
  }
};

export const sendBulkNotifications = async (recipients, notificationType, billData, language = 'en') => {
  try {
    const results = await Promise.all(
      recipients.map((recipientId) => sendBillNotification(recipientId, notificationType, billData, language))
    );

    return {
      success: true,
      results,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
    };
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    return { success: false, error: error.message };
  }
};

export const schedulePaymentReminders = async (billId, reminderDays = [7, 3, 1]) => {
  try {
    const billDoc = await getDoc(doc(db, 'bills', billId));
    if (!billDoc.exists()) {
      throw new Error('Bill not found');
    }

    const billData = billDoc.data();
    const dueDate = billData.dueDate.toDate();
    const today = new Date();

    for (const days of reminderDays) {
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - days);

      if (reminderDate > today) {
        await addDoc(collection(db, 'scheduledNotifications'), {
          billId,
          recipientId: billData.recipientId,
          notificationType: NOTIFICATION_TYPES.PAYMENT_REMINDER,
          scheduledFor: Timestamp.fromDate(reminderDate),
          billData: {
            billId,
            amount: billData.amount,
            currency: billData.currency,
            dueDate: dueDate.toLocaleDateString(),
            billType: billData.billType,
          },
          status: 'pending',
          createdAt: Timestamp.now(),
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error scheduling payment reminders:', error);
    throw error;
  }
};
