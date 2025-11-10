import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { USER_ROLES } from './constants';

export const diagnoseTicketAssignments = async () => {
  console.log('\n========================================');
  console.log('TICKET ASSIGNMENT DIAGNOSTICS');
  console.log('========================================\n');

  try {
    const allTicketsSnapshot = await getDocs(collection(db, 'tickets'));
    const allTickets = allTicketsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Total tickets in database: ${allTickets.length}\n`);

    const assignedTickets = allTickets.filter(ticket => ticket.assignedTo);
    console.log(`Tickets with assignedTo field: ${assignedTickets.length}\n`);

    if (assignedTickets.length === 0) {
      console.log('No assigned tickets found.');
      return;
    }

    const serviceProvidersSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', USER_ROLES.SERVICE_PROVIDER))
    );

    const serviceProviders = serviceProvidersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    console.log(`Total service providers: ${serviceProviders.length}\n`);
    console.log('Service Providers:');
    serviceProviders.forEach(sp => {
      console.log(`  - UID: ${sp.uid}`);
      console.log(`    Email: ${sp.email}`);
      console.log(`    Name: ${sp.displayName || 'N/A'}\n`);
    });

    console.log('Assigned Tickets Analysis:\n');
    const issues = [];

    for (const ticket of assignedTickets) {
      const matchingProvider = serviceProviders.find(sp => sp.uid === ticket.assignedTo);

      console.log(`Ticket: ${ticket.title} (${ticket.id})`);
      console.log(`  assignedTo: ${ticket.assignedTo}`);
      console.log(`  assignedToEmail: ${ticket.assignedToEmail || 'N/A'}`);
      console.log(`  status: ${ticket.status}`);

      if (!matchingProvider) {
        console.log(`  ⚠️  WARNING: No service provider found with UID "${ticket.assignedTo}"`);

        const emailMatch = serviceProviders.find(sp => sp.email === ticket.assignedTo);
        if (emailMatch) {
          console.log(`  ℹ️  Found service provider by EMAIL match:`);
          console.log(`     Email: ${emailMatch.email}`);
          console.log(`     Correct UID: ${emailMatch.uid}`);
          issues.push({
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            incorrectValue: ticket.assignedTo,
            correctValue: emailMatch.uid,
            providerEmail: emailMatch.email,
            providerName: emailMatch.displayName
          });
        } else {
          console.log(`  ❌ ERROR: Could not find matching service provider by UID or email`);
        }
      } else {
        console.log(`  ✓ Valid assignment to: ${matchingProvider.email}`);
      }
      console.log('');
    }

    if (issues.length > 0) {
      console.log('\n========================================');
      console.log('ISSUES FOUND');
      console.log('========================================\n');
      console.log(`${issues.length} ticket(s) have incorrect assignedTo values:\n`);

      issues.forEach((issue, index) => {
        console.log(`${index + 1}. Ticket: "${issue.ticketTitle}" (${issue.ticketId})`);
        console.log(`   Current assignedTo: ${issue.incorrectValue}`);
        console.log(`   Should be: ${issue.correctValue}`);
        console.log(`   Provider: ${issue.providerName || issue.providerEmail}\n`);
      });

      return issues;
    } else {
      console.log('✓ All ticket assignments are valid!\n');
      return [];
    }

  } catch (error) {
    console.error('Error running diagnostics:', error);
    throw error;
  }
};

export const fixTicketAssignment = async (ticketId, correctUid, providerEmail, providerName) => {
  try {
    console.log(`\nFixing ticket ${ticketId}...`);

    await updateDoc(doc(db, 'tickets', ticketId), {
      assignedTo: correctUid,
      assignedToEmail: providerEmail,
      assignedToName: providerName || providerEmail,
      updatedAt: new Date()
    });

    console.log(`✓ Successfully updated ticket ${ticketId}`);
    console.log(`  assignedTo is now: ${correctUid}`);

    const updatedTicket = await getDoc(doc(db, 'tickets', ticketId));
    console.log('  Verified update:', updatedTicket.data().assignedTo);

    return true;
  } catch (error) {
    console.error(`✗ Failed to fix ticket ${ticketId}:`, error);
    throw error;
  }
};

export const fixAllTicketAssignments = async () => {
  console.log('\n========================================');
  console.log('FIXING TICKET ASSIGNMENTS');
  console.log('========================================\n');

  const issues = await diagnoseTicketAssignments();

  if (issues.length === 0) {
    console.log('No issues to fix!');
    return { fixed: 0, failed: 0 };
  }

  console.log(`\nAttempting to fix ${issues.length} ticket(s)...\n`);

  let fixed = 0;
  let failed = 0;

  for (const issue of issues) {
    try {
      await fixTicketAssignment(
        issue.ticketId,
        issue.correctValue,
        issue.providerEmail,
        issue.providerName
      );
      fixed++;
    } catch (error) {
      console.error(`Failed to fix ticket ${issue.ticketId}`);
      failed++;
    }
  }

  console.log('\n========================================');
  console.log('FIX SUMMARY');
  console.log('========================================');
  console.log(`✓ Fixed: ${fixed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log('========================================\n');

  return { fixed, failed };
};

if (typeof window !== 'undefined') {
  window.diagnoseTickets = diagnoseTicketAssignments;
  window.fixTickets = fixAllTicketAssignments;
  console.log('\n💡 Diagnostic utilities loaded!');
  console.log('   Run window.diagnoseTickets() to check ticket assignments');
  console.log('   Run window.fixTickets() to automatically fix issues\n');
}
