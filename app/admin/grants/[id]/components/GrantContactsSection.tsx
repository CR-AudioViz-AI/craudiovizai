// app/admin/grants/[id]/components/GrantContactsSection.tsx
// Multiple contacts per grant with full details
// Timestamp: Saturday, December 13, 2025 - 12:10 PM EST

'use client';

import { useState } from 'react';
import { 
  Users, Plus, Phone, Mail, MapPin, Star, Edit, Trash2,
  User, Building, MessageSquare, Calendar, MoreHorizontal,
  ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  organization: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  fax: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  preferred_contact_method: string;
  best_time_to_contact: string | null;
  contact_type: string;
  is_primary: boolean;
  notes: string | null;
  last_contact_date: string | null;
  next_followup_date: string | null;
}

const CONTACT_TYPE_LABELS: Record<string, string> = {
  program_officer: 'Program Officer',
  grants_manager: 'Grants Manager',
  technical_contact: 'Technical Contact',
  financial_contact: 'Financial Contact',
  administrative: 'Administrative',
  executive: 'Executive',
  other: 'Other',
};

export default function GrantContactsSection({ 
  grantId, 
  contacts 
}: { 
  grantId: string;
  contacts: Contact[];
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div 
        className="p-4 border-b border-gray-100 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Contacts</h2>
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
            {contacts.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAddForm(true);
            }}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="divide-y divide-gray-100">
          {contacts.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No contacts added yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Add your first contact
              </button>
            </div>
          ) : (
            contacts.map((contact) => (
              <div key={contact.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      contact.is_primary ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                      {contact.is_primary ? (
                        <Star className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <User className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </h3>
                        {contact.is_primary && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            Primary
                          </span>
                        )}
                      </div>
                      {contact.title && (
                        <p className="text-sm text-gray-600">{contact.title}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {CONTACT_TYPE_LABELS[contact.contact_type] || contact.contact_type}
                        {contact.organization && ` • ${contact.organization}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setExpandedContact(
                        expandedContact === contact.id ? null : contact.id
                      )}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    >
                      {expandedContact === contact.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Contact Info */}
                <div className="mt-3 flex flex-wrap gap-3">
                  {contact.email && (
                    <a 
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Mail className="w-4 h-4" />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a 
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700"
                    >
                      <Phone className="w-4 h-4" />
                      {contact.phone}
                    </a>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedContact === contact.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contact.mobile && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase">Mobile</label>
                        <p className="text-sm text-gray-900">{contact.mobile}</p>
                      </div>
                    )}
                    {contact.fax && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase">Fax</label>
                        <p className="text-sm text-gray-900">{contact.fax}</p>
                      </div>
                    )}
                    {contact.department && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase">Department</label>
                        <p className="text-sm text-gray-900">{contact.department}</p>
                      </div>
                    )}
                    {contact.preferred_contact_method && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase">Preferred Contact</label>
                        <p className="text-sm text-gray-900 capitalize">{contact.preferred_contact_method}</p>
                      </div>
                    )}
                    {contact.best_time_to_contact && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase">Best Time</label>
                        <p className="text-sm text-gray-900">{contact.best_time_to_contact}</p>
                      </div>
                    )}
                    {(contact.address_line1 || contact.city) && (
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 uppercase">Address</label>
                        <p className="text-sm text-gray-900">
                          {contact.address_line1}
                          {contact.address_line2 && <><br />{contact.address_line2}</>}
                          {contact.city && <><br />{contact.city}, {contact.state} {contact.postal_code}</>}
                          {contact.country && contact.country !== 'USA' && <><br />{contact.country}</>}
                        </p>
                      </div>
                    )}
                    {contact.notes && (
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 uppercase">Notes</label>
                        <p className="text-sm text-gray-900">{contact.notes}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Last Contact</label>
                      <p className="text-sm text-gray-900">{formatDate(contact.last_contact_date)}</p>
                    </div>
                    {contact.next_followup_date && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase">Next Follow-up</label>
                        <p className="text-sm text-gray-900">{formatDate(contact.next_followup_date)}</p>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="md:col-span-2 flex gap-2 pt-2">
                      <button className="flex-1 py-2 px-3 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        Log Communication
                      </button>
                      <button className="flex-1 py-2 px-3 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Schedule Follow-up
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Contact Modal would go here */}
      {showAddForm && (
        <AddContactForm 
          grantId={grantId} 
          onClose={() => setShowAddForm(false)} 
        />
      )}
    </div>
  );
}

function AddContactForm({ 
  grantId, 
  onClose 
}: { 
  grantId: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      const response = await fetch(`/api/admin/grants/${grantId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error adding contact:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">Add Contact</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                name="first_name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                name="last_name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                name="title"
                placeholder="e.g., Senior Program Officer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Type</label>
              <select
                name="contact_type"
                defaultValue="program_officer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="program_officer">Program Officer</option>
                <option value="grants_manager">Grants Manager</option>
                <option value="technical_contact">Technical Contact</option>
                <option value="financial_contact">Financial Contact</option>
                <option value="administrative">Administrative</option>
                <option value="executive">Executive</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
              <input
                name="organization"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                name="department"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                name="phone"
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <input
                name="mobile"
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
              <input
                name="fax"
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
            <input
              name="address_line1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
            <input
              name="address_line2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                name="city"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                name="state"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                name="postal_code"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Contact Method</label>
              <select
                name="preferred_contact_method"
                defaultValue="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="mobile">Mobile</option>
                <option value="mail">Mail</option>
                <option value="in_person">In Person</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Best Time to Contact</label>
              <input
                name="best_time_to_contact"
                placeholder="e.g., Mornings, after 2pm EST"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Any important notes about this contact..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_primary"
              id="is_primary"
              value="true"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_primary" className="text-sm text-gray-700">
              Set as primary contact
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
