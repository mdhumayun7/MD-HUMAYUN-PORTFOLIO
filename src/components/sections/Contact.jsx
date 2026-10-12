import { useState } from 'react'
import { Github, Linkedin, Mail, Phone } from 'lucide-react'
import { site } from '../../config/site'
import { profile } from '../../data/profile'
import { roles } from '../../data/roles'
import { Section } from '../layout/Section'
import { Button } from '../ui/Button'

/**
 * Works with no backend and no account: if a Formspree form ID is configured
 * in src/config/site.js the message is posted there, otherwise the form opens
 * the visitor's email client with everything pre-filled. Either way the
 * button does what it says.
 */
export function Contact() {
  const formId = site.contactForm.formId
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [values, setValues] = useState({ name: '', email: '', message: '' })

  const update = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formId) {
      const subject = encodeURIComponent(`Portfolio enquiry from ${values.name || 'someone'}`)
      const body = encodeURIComponent(`${values.message}\n\n— ${values.name}\n${values.email}`)
      window.location.href = `mailto:${profile.contact.email}?subject=${subject}&body=${body}`
      setStatus('sent')
      return
    }

    setStatus('sending')
    try {
      const res = await fetch(`https://formspree.io/f/${formId}`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error('Request failed')
      setStatus('sent')
      setValues({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <Section id="contact" title="Get in touch" lead={profile.availability}>
      <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_280px] md:gap-16">
        <form onSubmit={handleSubmit} className="max-w-prose space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="name" label="Your name" value={values.name} onChange={update('name')} required />
            <Field
              id="email"
              type="email"
              label="Your email"
              value={values.email}
              onChange={update('email')}
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-micro text-muted">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              value={values.message}
              onChange={update('message')}
              className="mt-1.5 w-full border border-line bg-bg px-3 py-2 text-base
                         outline-none transition-colors focus:border-accent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send message'}
            </Button>

            {/* One live region for every outcome, so screen readers announce it. */}
            <p aria-live="polite" className="text-small">
              {status === 'sent' && !formId && (
                <span className="text-accent">Your email client should be open with the message ready.</span>
              )}
              {status === 'sent' && formId && <span className="text-accent">Message sent. I will reply soon.</span>}
              {status === 'error' && (
                <span className="text-[#c2542f]">
                  That did not go through. Email {profile.contact.email} directly instead.
                </span>
              )}
            </p>
          </div>
        </form>

        <div className="space-y-4 border-t border-line pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <DirectLink Icon={Mail} label={profile.contact.email} href={`mailto:${profile.contact.email}`} />
          <DirectLink Icon={Phone} label={profile.contact.phone} href={`tel:${profile.contact.phone.replace(/\s/g, '')}`} />
          <DirectLink Icon={Github} label="github.com/mdhumayun7" href={profile.contact.github} external />
          <DirectLink Icon={Linkedin} label="LinkedIn" href={profile.contact.linkedin} external />
          <p className="pt-2 text-micro text-muted">{profile.location}</p>
          <div className="border-t border-line pt-4">
            <p className="text-micro text-muted">Open to</p>
            <ul className="mt-2 space-y-1 text-small">
              {roles.map((r) => (
                <li key={r.id}>{r.label}</li>
              ))}
              <li>Research collaboration</li>
            </ul>
          </div>
        </div>
      </div>
    </Section>
  )
}

function Field({ id, label, type = 'text', value, onChange, required }) {
  return (
    <div>
      <label htmlFor={id} className="block text-micro text-muted">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="mt-1.5 w-full border border-line bg-bg px-3 py-2 text-base
                   outline-none transition-colors focus:border-accent"
      />
    </div>
  )
}

function DirectLink({ Icon, label, href, external }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : null)}
      className="flex items-center gap-2.5 text-small transition-colors hover:text-accent"
    >
      <Icon size={15} aria-hidden className="text-muted" />
      {label}
    </a>
  )
}
