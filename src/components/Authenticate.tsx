import { useState } from 'react'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import useSettingsStore from '~/hooks/useSettingsStore'
import { nip19 } from 'nostr-tools'

declare global {
  interface Window {
    nostr: any
  }
}

const PubkeyForm = ({ close }: { close: () => void }) => {
  const setPubkey = useSettingsStore((state) => state.setPubkey)

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
      try {
        let { type, data: nipData } = nip19.decode(data.pubkey)
        if (type === 'npub') {
          setPubkey(nipData as string)
          close()
          return
        } else {
          setError('pubkey', { message: 'Invalid npub key' })
          return
        }
      } catch (error) {
        console.error(error)
        setError('pubkey', { message: 'Invalid npub key' })
        return
      }
    }

    try {
      // try npub encode to vaildate hex public key
      nip19.npubEncode(data.pubkey)
      setPubkey(data.pubkey)
      close()
    } catch (error) {
      console.error(error)
      setError('pubkey', { message: 'Invalid hex public key' })
    }
  }

  return (
    <div className="flex flex-col gap-y-2">
      <h2 className="text-lg font-semibold">Log in with Nostr public key</h2>
      <form className="grow " spellCheck={false} onSubmit={handleSubmit(onSubmit)}>
        <input
          className={`${
            errors.pubkey && 'border-red-500'
          } focus:shadow-outline w-full min-w-[20ch] resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-2 px-3 leading-tight text-white shadow placeholder:italic focus:border-primary focus:bg-slate-900 focus:outline-none`}
          type="text"
          placeholder="hex public key / npub..."
          autoComplete="off"
          {...register('pubkey')}
        />
        {errors.pubkey && <p className="text-sm ">{errors.pubkey.message}</p>}
      </form>
      <button
        className={`${
          isDirty ? 'bg-primary hover:bg-primary/80' : 'bg-gray-500'
        } w-full items-center rounded px-3 py-2 text-center text-sm font-semibold uppercase shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg`}
        disabled={!isDirty}
        onClick={handleSubmit(onSubmit)}
      >
        Log in with public key
      </button>
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

const Nip07Login = ({ close }: { close: () => void }) => {
  const setPubkey = useSettingsStore((state) => state.setPubkey)
  const [waiting, setWaiting] = useState(false)

  const onClick = async () => {
    try {
      setWaiting(true)
      const pubkey = await window.nostr.getPublicKey()
      setPubkey(pubkey)
      close()
    } catch (error) {
      console.error(error)
    }

    setWaiting(false)
  }

  return (
    <div className="flex flex-col gap-y-2">
      <h2 className="text-lg font-semibold">Recommended</h2>
      {window.nostr && (
        <button
          className={`${
            !waiting ? 'bg-primary hover:bg-primary/80' : 'bg-gray-500'
          } w-full items-center rounded px-3 py-2 text-center text-sm font-semibold uppercase shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg`}
          onClick={() => onClick()}
        >
          {!waiting && 'Log in with extension (NIP07)'}
          {waiting && 'Waiting for extension...'}
        </button>
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
  return (
    <div className={'flex flex-col gap-8'}>
      <PubkeyForm close={close} />
      <Nip07Login close={close} />
    </div>
  )
}
