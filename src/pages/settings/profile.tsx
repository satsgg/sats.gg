import getSettingsLayout from '~/components/Settings/Layout'
import { useProfile } from '~/hooks/useProfile'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import { useEffect } from 'react'
import Input from '~/components/Settings/Input'
import useCanSign from '~/hooks/useCanSign'
import { getEventHash, signEvent, UnsignedEvent } from 'nostr-tools'
import { verifySignature, validateEvent } from 'nostr-tools'
import { toast } from 'react-toastify'
import { nostrClient } from '~/nostr/NostrClient'
import useAuthStore from '~/hooks/useAuthStore'

export default function Profile() {
  const pubkey = useAuthStore((state) => state.pubkey)
  const { profile, isLoading } = useProfile(pubkey)
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
    schema: z.object({
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
    }),
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

  const onSubmit = async (data: any) => {
    console.log('data', data)
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
      const signedEvent = await window.nostr.signEvent(event)
      console.debug('signedEvent', signedEvent)
      let ok = validateEvent(signedEvent)
      if (!ok) throw new Error('Invalid event')
      let veryOk = verifySignature(signedEvent)
      if (!veryOk) throw new Error('Invalid signature')

      console.debug('event id', signedEvent.id)
      nostrClient.publish(signedEvent)
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
    console.debug('effect', profile)
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
    <div className="flex w-3/5 flex-col gap-4">
      <h2 className="font-md text-2xl">Profile</h2>
      <h3 className="font-sm text-sm text-gray-400">Set your nostr kind0 profile metadata information.</h3>

      <div className="flex flex-col gap-4 rounded border border-gray-500 bg-stone-800 px-6 py-4">
        <form className="flex flex-col gap-2" spellCheck={false} onSubmit={handleSubmit(onSubmit)}>
          <div className="flex gap-4">
            {profile && profile.picture ? (
              <img className="h-52 w-52" src={profile?.picture ?? undefined} alt={`profile image of ${pubkey}`} />
            ) : (
              <div className="h-52 w-52 border border-gray-500" />
            )}
            <div className="flex grow flex-col gap-2">
              <div>
                <p>Your Name</p>
                <Input name={'name'} register={register} />
              </div>
              <div>
                <p>Display Name</p>
                <Input name={'display_name'} register={register} />
              </div>
              <div>
                <p>Picture URL</p>
                <Input name={'picture'} register={register} />
              </div>
            </div>
          </div>

          <div>
            <p>About</p>
            <Input name={'about'} register={register} />
          </div>
          <div>
            <p>Website URL</p>
            <Input name={'website'} placeholder={'https://example.com'} register={register} />
          </div>
          <div>
            <p>Banner URL</p>
            <Input name={'banner'} register={register} />
          </div>
          <div>
            <p>LNURLPay</p>
            <Input name={'lud06'} placeholder={'LNURL1DP68GURN8GHJ7AMPD3KX2AR0VEE...'} register={register} />
          </div>
          <div>
            <p>Lightning Address</p>
            <Input name={'lud16'} placeholder={'name@getalby.com'} register={register} />
          </div>
          <div>
            <p>Nip05 Verification</p>
            <Input name={'nip05'} placeholder={'name@nostrplebs.com'} register={register} />
          </div>
        </form>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canSign}
            className="align-right inline-flex h-8 w-32 items-center justify-center rounded bg-primary px-2 py-1 text-sm font-semibold shadow-md transition duration-150 ease-in-out hover:bg-primary hover:shadow-lg focus:bg-primary focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary active:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-500"
            onClick={handleSubmit(onSubmit)}
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  )
}

Profile.getLayout = getSettingsLayout
