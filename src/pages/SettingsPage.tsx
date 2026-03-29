import { useState, type FormEvent } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export function SettingsPage() {
  const { profile, user } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ full_name: fullName, phone: phone || null })
      .eq('user_id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <Header title="Settings" description="Manage your account and preferences" />

      <div className="mx-auto max-w-2xl space-y-6 p-8">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-zinc-100">Profile</h2>
            <p className="text-sm text-zinc-400">Update your personal information</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                id="email"
                label="Email"
                value={user?.email || ''}
                disabled
                className="opacity-50"
              />
              <Input
                id="fullName"
                label="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
              <Input
                id="phone"
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+966 5xx xxx xxxx"
              />
              <div className="flex items-center gap-3">
                <Button type="submit" loading={saving}>
                  Save Changes
                </Button>
                {saved && (
                  <span className="text-sm text-emerald-400">Saved successfully</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-zinc-100">Account</h2>
            <p className="text-sm text-zinc-400">Manage your account settings</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-zinc-800/40 p-4">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Organization</p>
                  <p className="text-xs text-zinc-500">{profile?.organization_id || 'No organization'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-zinc-800/40 p-4">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Role</p>
                  <p className="text-xs text-zinc-500 capitalize">{profile?.role || 'viewer'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
