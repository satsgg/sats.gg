import { useEffect, useState } from 'react'
import SettingsStore from '~/store/settingsStore' 
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import useSettingsStore from '~/hooks/useSettingsStore'
import { nip19 } from 'nostr-tools'

const PubkeyForm = ({ close}: {  close: () => void}) => {
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
        let {type, data: nipData } = nip19.decode(data.pubkey)
        if (type === 'npub') {
          setPubkey(nipData as string)
          close()
          return
        } else {
          setError('pubkey', { message: 'Invalid npub key'})
          return
        }
      } catch(error) {
        console.error(error)
        setError('pubkey', { message: 'Invalid npub key'})
        return
      }
    }

    try {
      nip19.npubEncode(data.pubkey)
      setPubkey(data.pubkey)
      close()
    } catch(error) {
      console.error(error)
      setError('pubkey', { message: 'Invalid hex public key'})
    }
  }

  return (
    <div className="flex flex-col gap-y-2">
      <h2 className='font-semibold text-lg'>Log in with Nostr public key</h2>
      <form className="grow " spellCheck={false} onSubmit={handleSubmit(onSubmit)}>
        <input
          className={`${
            errors.pubkey && 'border-red-500'
          } focus:shadow-outline w-full min-w-[20ch] placeholder:italic resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-2 px-3 leading-tight text-white shadow focus:border-primary focus:bg-slate-900 focus:outline-none`}
          type="text"
          placeholder="hex public key / npub..."
          autoComplete="off"
          {...register('pubkey')}
        />
      {errors.pubkey && <p className="text-sm ">{errors.pubkey.message}</p>}
      </form>
      <button 
          className={`${isDirty ? 'bg-primary hover:bg-primary/80' : 'bg-gray-500'} w-full text-center items-center rounded bg-primary px-3 py-2 text-sm font-semibold uppercase shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:bg-primary focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary active:shadow-lg`}
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
    link: 'https://getalby.com/'
  },
  {
    name: 'nos2x',
    link: 'https://github.com/fiatjaf/nos2x'
  }
]

const Nip07Login = ({ close}: {  close: () => void}) => {
  return (
    <div className="flex flex-col gap-y-2">
      <h2 className="font-semibold text-lg">Recommended</h2>
      {window.nostr && 
        <button 
          className="w-full text-center items-center rounded bg-primary px-3 py-2 text-sm font-semibold uppercase shadow-md transition duration-150 ease-in-out hover:bg-primary/80 hover:shadow-lg focus:bg-primary focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary active:shadow-lg"
          onClick={(() => console.debug('window.nostr', window.nostr))}
          >
          Log in with extension (NIP07)
        </button>
      }
      {!window.nostr && (
        <div>
          <p>Install a Nip07 extension to log in and sign events</p>
          {recommendedExtensions.map((ext, index) => (
            <>
            <a className="text-primary capitalize hover:underline" href={ext.link} key={ext.name} target="_blank">{ext.name}</a>
            {index !== recommendedExtensions.length-1 && <span>, </span>}
            </>
          ))}
        </div>
      )}
    </div>
  )
}

export const Authenticate = ({ close}: {  close: () => void}) => {

  return (
    <div className={'flex flex-col gap-8'}>
      <PubkeyForm close={close}/>
      <Nip07Login close={close} />
    </div>
  )
}