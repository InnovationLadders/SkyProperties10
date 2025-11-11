import { useState } from 'react';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ContactModal = ({ isOpen, onClose, property, unit }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const newDocRef = doc(collection(db, 'inquiries'));
      await setDoc(newDocRef, {
        ...formData,
        propertyId: property?.id,
        propertyName: property?.name,
        unitId: unit?.id,
        unitNumber: unit?.unitNumber,
        type: 'sale',
        status: 'new',
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ name: '', email: '', phone: '', message: '' });
      }, 2000);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      setError('Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Request Contact</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {property?.name} {unit && `- Unit ${unit.unitNumber}`}
              </p>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Inquiry Sent!</h3>
                  <p className="text-muted-foreground">
                    We'll get back to you as soon as possible.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm"
                      placeholder="I'm interested in this property..."
                    />
                  </div>

                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button type="submit" disabled={loading} className="flex-1">
                      <Send className="h-4 w-4 mr-2" />
                      {loading ? 'Sending...' : 'Send Inquiry'}
                    </Button>
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
