import { useState } from 'react'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import { nip19 } from 'nostr-tools'
import { signAuthEvent, validHexKey, validNpubKey } from '~/utils/nostr'
import { verifySignature } from 'nostr-tools'
import { trpc } from '~/utils/trpc'
import { toast } from 'react-toastify'
import useAuthStore from '~/hooks/useAuthStore'
import Button from './Button'

declare global {
  interface Window {
    nostr: any
  }
}

const PubkeyForm = ({ close }: { close: () => void }) => {
  const [setPubkey, setView] = useAuthStore((state) => [state.setPubkey, state.setView])

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useZodForm({
    mode: 'onSubmit',
    schema: z.object({ pubkey: z.string() }),
    defaultValues: {
      pubkey: '',
    },
  })

  const onSubmit = (data: { pubkey: string }) => {
    if (data.pubkey.startsWith('npub1')) {
      if (!validNpubKey(data.pubkey)) {
        setError('pubkey', { message: 'Invalid npub key' })
        return
      }
      let { type, data: nipData } = nip19.decode(data.pubkey)
      setPubkey(nipData as string)
    } else if (!validHexKey(data.pubkey)) {
      setError('pubkey', { message: 'Invalid hex public key' })
      return
    } else {
      setPubkey(data.pubkey)
    }

    setView('pubkey')
    close()
  }

  return (
    <div className="flex flex-col gap-y-2">
      <h2 className="text-lg font-semibold">Log in with Nostr public key</h2>
      <form className="grow " spellCheck={false} onSubmit={handleSubmit(onSubmit)}>
        <input
          className={`${
            errors.pubkey && 'border-red-500 focus:border-red-500'
          } focus:shadow-outline w-full min-w-[20ch] resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-2 px-3 leading-tight text-white shadow placeholder:italic focus:border-primary focus:bg-slate-900 focus:outline-none`}
          type="text"
          placeholder="hex public key / npub..."
          autoComplete="off"
          {...register('pubkey')}
        />
        {errors.pubkey && <p className="text-sm ">{errors.pubkey.message}</p>}
      </form>
      <Button disabled={!isDirty} onClick={handleSubmit(onSubmit)}>
        Log in with public key
      </Button>
    </div>
  )
}

const recommendedExtensions = [
  {
    name: 'alby',
    link: 'https://getalby.com/',
  },
  {
    name: 'nos2x',
    link: 'https://github.com/fiatjaf/nos2x',
  },
  // {
  //   name: 'nos2x-fox',
  //   link: 'https://diegogurpegui.com/nos2x-fox/'
  // }
]

const Nip07Login = ({ challenge, close }: { challenge: string | undefined; close: () => void }) => {
  const [setPubkey, setView, setAuthToken] = useAuthStore((state) => [
    state.setPubkey,
    state.setView,
    state.setAuthToken,
  ])
  const [waiting, setWaiting] = useState(false)
  const mutation = trpc.auth.login.useMutation()

  const onClick = async () => {
    try {
      // TODO: user won't receive any feedback why button doesn't do anything
      // if we fail to get the challenge
      if (!challenge) return
      setWaiting(true)

      const pubkey = await window.nostr.getPublicKey()
      const signedEvent = await signAuthEvent(pubkey, challenge)
      console.debug('signedEvent', signedEvent)

      let veryOk = verifySignature(signedEvent)
      if (!veryOk) throw new Error('Invalid signature')

      const data = await mutation.mutateAsync(signedEvent)

      setPubkey(pubkey)
      setView('authenticated')
      setAuthToken(data.authToken)
      close()
    } catch (error: any) {
      console.error(error)
      // TODO: display errors in auth module
      toast.error(error.message, {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    }

    setWaiting(false)
  }

  return (
    <div className="flex flex-col gap-y-2">
      <h2 className="text-lg font-semibold">Recommended</h2>
      {window.nostr && (
        <Button disabled={waiting} onClick={onClick}>
          {!waiting ? 'Log in with extension (NIP07)' : 'Waiting for extension...'}
        </Button>
      )}
      {!window.nostr && (
        <div>
          <p>Install a Nip07 extension to log in and sign events</p>
          {recommendedExtensions.map((ext, index) => (
            <>
              <a className="capitalize text-primary hover:underline" href={ext.link} key={ext.name} target="_blank">
                {ext.name}
              </a>
              {index !== recommendedExtensions.length - 1 && <span>, </span>}
            </>
          ))}
        </div>
      )}
    </div>
  )
}

export const Authenticate = ({ close }: { close: () => void }) => {
  const { data } = trpc.auth.getChallenge.useQuery(undefined, { refetchOnWindowFocus: false })

  // const utils = trpc.useContext()
  // useEffect(() => {
  //   utils.auth.getChallenge.fetch().then((data) => console.debug('data', data))
  // }, [])

  return (
    <div className={'flex flex-col gap-8'}>
      <PubkeyForm close={close} />
      <Nip07Login challenge={data?.challenge} close={close} />
    </div>
  )
}
