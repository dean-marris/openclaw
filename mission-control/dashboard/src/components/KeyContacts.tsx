'use client'
import { useState, useEffect, useRef } from 'react'
import { api } from '../../../convex/_generated/api'
import { useQuery, useMutation } from 'convex/react'
import type { Id } from '../../../convex/_generated/dataModel'

type ContactForm = {
  name: string
  title: string
  company: string
  email: string
  phone: string
  address: string
  url: string
  notes: string
  relationship: string
  sortOrder: string
}

const emptyForm: ContactForm = {
  name: '', title: '', company: '', email: '', phone: '',
  address: '', url: '', notes: '', relationship: '', sortOrder: '',
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function KeyContacts() {
  const contacts = useQuery(api.keyContacts.listContacts)
  const seedContacts = useMutation(api.keyContacts.seedContacts)
  const addContact = useMutation(api.keyContacts.addContact)
  const updateContact = useMutation(api.keyContacts.updateContact)
  const deleteContact = useMutation(api.keyContacts.deleteContact)

  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<Id<'keyContacts'> | null>(null)
  const [form, setForm] = useState<ContactForm>(emptyForm)
  const seeded = useRef(false)

  useEffect(() => {
    if (contacts && contacts.length === 0 && !seeded.current) {
      seeded.current = true
      seedContacts()
    }
  }, [contacts, seedContacts])

  const uploadPortalContact = contacts?.find(c => c.url)

  const handleSave = async () => {
    if (!form.name.trim()) return
    const data = {
      name: form.name.trim(),
      title: form.title.trim() || undefined,
      company: form.company.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      url: form.url.trim() || undefined,
      notes: form.notes.trim() || undefined,
      relationship: form.relationship.trim() || undefined,
      sortOrder: form.sortOrder ? Number(form.sortOrder) : undefined,
    }
    if (editingId) {
      await updateContact({ id: editingId, ...data })
      setEditingId(null)
    } else {
      await addContact(data)
    }
    setForm(emptyForm)
    setShowAdd(false)
  }

  const startEdit = (contact: NonNullable<typeof contacts>[number]) => {
    setEditingId(contact._id)
    setForm({
      name: contact.name,
      title: contact.title || '',
      company: contact.company || '',
      email: contact.email || '',
      phone: contact.phone || '',
      address: contact.address || '',
      url: contact.url || '',
      notes: contact.notes || '',
      relationship: contact.relationship || '',
      sortOrder: contact.sortOrder?.toString() || '',
    })
    setShowAdd(true)
  }

  const handleCancel = () => {
    setShowAdd(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = async (id: Id<'keyContacts'>) => {
    await deleteContact({ id })
    if (editingId === id) handleCancel()
  }

  const set = (field: keyof ContactForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const inputCls = 'bg-[#0f1117] border border-[#2d3748] text-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">👔</span> Key Contacts
          </h2>
          <p className="text-sm text-[#718096] mt-1">Tax professionals &amp; advisors for the Marris family</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); setForm(emptyForm) }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          + Add Contact
        </button>
      </div>

      {/* Upload Portal banner */}
      {uploadPortalContact?.url && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="text-amber-400 font-semibold text-lg flex items-center gap-2">
              <span className="text-xl">📤</span> Document Upload Portal
            </div>
            <p className="text-amber-300/70 text-sm mt-1">Submit documents directly to your CPA</p>
          </div>
          <a
            href={uploadPortalContact.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg text-sm transition-colors"
          >
            Open Upload Portal
          </a>
        </div>
      )}

      {/* Add / Edit form */}
      {showAdd && (
        <div className="bg-[#1e2230] border border-[#2d3748] rounded-lg p-5 space-y-4">
          <h3 className="text-white font-semibold">{editingId ? 'Edit Contact' : 'New Contact'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Name *" value={form.name} onChange={set('name')} className={inputCls} />
            <input placeholder="Title / Role" value={form.title} onChange={set('title')} className={inputCls} />
            <input placeholder="Company" value={form.company} onChange={set('company')} className={inputCls} />
            <input placeholder="Email" value={form.email} onChange={set('email')} className={inputCls} />
            <input placeholder="Phone" value={form.phone} onChange={set('phone')} className={inputCls} />
            <input placeholder="Address" value={form.address} onChange={set('address')} className={inputCls} />
            <input placeholder="URL" value={form.url} onChange={set('url')} className={inputCls} />
            <input placeholder="Relationship (e.g. CPA)" value={form.relationship} onChange={set('relationship')} className={inputCls} />
            <input placeholder="Sort Order (number)" value={form.sortOrder} onChange={set('sortOrder')} className={inputCls} />
          </div>
          <textarea placeholder="Notes" value={form.notes} onChange={set('notes')} rows={2} className={`w-full ${inputCls}`} />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {editingId ? 'Update Contact' : 'Save Contact'}
            </button>
            <button onClick={handleCancel} className="px-4 py-2 bg-[#2d3748] hover:bg-[#3d4758] text-slate-300 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contact cards */}
      {contacts === undefined ? (
        <div className="text-center py-12 text-[#718096]">Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 text-[#718096]">No contacts yet. Seeding defaults...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {contacts.map(contact => (
            <div
              key={contact._id}
              className="bg-[#1e2230] border border-[#2d3748] rounded-lg p-5 flex gap-4 relative group"
            >
              {/* Avatar */}
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{getInitials(contact.name)}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="text-white font-semibold text-lg leading-tight">{contact.name}</div>
                {contact.title && <div className="text-blue-400 text-sm">{contact.title}</div>}
                {contact.company && <div className="text-slate-400 text-sm">{contact.company}</div>}

                <div className="space-y-1 mt-3">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>📧</span>
                      <a href={`mailto:${contact.email}`} className="text-blue-400 hover:text-blue-300 hover:underline truncate">{contact.email}</a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>📱</span>
                      <a href={`tel:${contact.phone}`} className="text-slate-300 hover:text-white">{contact.phone}</a>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>📍</span>
                      <span className="text-slate-300">{contact.address}</span>
                    </div>
                  )}
                  {contact.url && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>🔗</span>
                      <a
                        href={contact.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline truncate"
                      >
                        {contact.url.includes('upload') ? 'Document Upload Portal' : contact.url}
                      </a>
                    </div>
                  )}
                </div>

                {contact.notes && (
                  <div className="mt-2 text-xs text-slate-400 bg-[#0f1117] rounded px-3 py-2">{contact.notes}</div>
                )}
              </div>

              {/* Actions */}
              <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(contact)}
                  className="text-[#718096] hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(contact._id)}
                  className="text-[#718096] hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
