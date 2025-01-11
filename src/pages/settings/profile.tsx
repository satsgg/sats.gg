import getSettingsLayout from '~/components/Settings/Layout'
import { useProfile } from '~/hooks/useProfile'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import useCanSign from '~/hooks/useCanSign'
import { Event as NostrEvent, UnsignedEvent } from 'nostr-tools'
import { verifySignature, validateEvent } from 'nostr-tools'
import { toast } from 'react-toastify'
import { nostrClient } from '~/nostr/NostrClient'
import useAuthStore from '~/hooks/useAuthStore'
import { signEventPrivkey } from '~/utils/nostr'
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'

const profileSchema = z.object({
  name: z.string().optional(),
  display_name: z.string().optional(),
  picture: z.union([z.literal(''), z.string().trim().url()]),
  about: z.string().optional(),
  // TODO: url parse requires https://... shouldn't require that?
  website: z.union([z.literal(''), z.string().trim().url()]),
  banner: z.union([z.literal(''), z.string().trim().url()]),
  lud06: z.string().optional(),
  lud16: z.string().optional(),
  nip05: z.string().optional(),
})

export default function Profile() {
  const [pubkey, view, privkey] = useAuthStore((state) => [state.pubkey, state.view, state.privkey])
  const { profile, isLoading } = useProfile(pubkey)
  const [profilePicPreview, setProfilePicPreview] = useState('')
  const canSign = useCanSign()

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    reset,
    // TODO: Display errors
    formState: { errors },
  } = useZodForm({
    mode: 'onSubmit',
    schema: profileSchema,
    defaultValues: {
      name: '',
      display_name: '',
      picture: '',
      about: '',
      website: '',
      banner: '',
      lud06: '',
      lud16: '',
      nip05: '',
    },
  })

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'picture') {
        setProfilePicPreview(value.picture || '')
      }
    })
    return () => subscription.unsubscribe()
  }, [watch])

  const onSubmit = async (data: any) => {
    if (!pubkey) return
    // TODO: filter out any empty values ('') for event
    // don't need to populate a bunch of empty strings...
    const event: UnsignedEvent = {
      kind: 0,
      pubkey: pubkey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: JSON.stringify(data),
    }

    try {
      const signedEvent: NostrEvent | null =
        view === 'default' ? signEventPrivkey(event, privkey) : await window.nostr.signEvent(event)
      if (!signedEvent) throw new Error('Failed to sign event')
      let ok = validateEvent(signedEvent)
      if (!ok) throw new Error('Invalid event')
      let veryOk = verifySignature(signedEvent)
      if (!veryOk) throw new Error('Invalid signature')

      nostrClient.publish(signedEvent)
      // TODO: Wait for event to be seen before signalling success
      toast.success('Published profile update!', {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    } catch (err: any) {
      console.error(err.message)
      toast.error(err.message, {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    }
  }

  useEffect(() => {
    // TODO: Last/slowest relay to return profile can reset our input...
    // i.e. brb.io connects, receives the profile sub (which should be deleted already...)
    // then updates way late...
    // maybe we should allow the user to select which relay to use for loading their existing metadata
    // also want better information from sub to know when it returned results..
    // so we can kinda simulate a 'loading' and disable inputs/buttons
    // each relay could have different metadata...
    // which they do for jack's npub for example
    reset({ ...profile })
  }, [profile])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-4 px-1">
      <div className="flex items-center space-x-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profilePicPreview || profile?.picture || ''} alt="Profile picture" />
          <AvatarFallback>User</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Label htmlFor="picture">Profile Picture URL</Label>
          <Input id="picture" {...register('picture')} placeholder="https://example.com/profile.jpg" />
        </div>
      </div>

      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} placeholder="John Doe" />
      </div>

      <div>
        <Label htmlFor="display_name">Display Name</Label>
        <Input id="display_name" {...register('display_name')} placeholder="johndoe" />
      </div>

      <div>
        <Label htmlFor="about">About Me</Label>
        <Textarea id="about" {...register('about')} placeholder="Tell us about yourself" />
      </div>

      <div>
        <Label htmlFor="website">Website</Label>
        <Input id="website" {...register('website')} placeholder="https://example.com" />
      </div>

      <div>
        <Label htmlFor="banner">Banner Picture URL</Label>
        <Input id="banner" {...register('banner')} placeholder="https://example.com/banner.jpg" />
      </div>

      <div>
        <Label htmlFor="nip05">NIP05 Verification</Label>
        <Input id="nip05" {...register('nip05')} type="email" placeholder="john@example.com" />
      </div>

      <div>
        <Label htmlFor="lud06">LNURLPay</Label>
        <Input id="lud06" {...register('lud06')} placeholder="LNURL1DP68GURN8GHJ7AMPD3KX2AR0VEE..." />
      </div>

      <div>
        <Label htmlFor="lud16">Lightning Address</Label>
        <Input id="lud16" {...register('lud16')} type="email" placeholder="name@getalby.com" />
      </div>

      <Button type="submit" disabled={false}>
        {/* TODO: Loading state, disable button, seen on X relays */}
        Publish
      </Button>
    </form>
  )
}

Profile.getLayout = getSettingsLayout
