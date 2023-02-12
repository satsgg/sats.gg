import { useProfile } from "~/hooks/useProfile"
import useSettingsStore from "~/hooks/useSettingsStore"
import { useZodForm } from "~/utils/useZodForm"
import { z } from 'zod'
import { useEffect } from "react"

const Input = ({ label, name, placeholder, register }: {label: string, name: string, placeholder?: string, register: Function}) => {
  return (
    <div>
      <p>{label}</p>
      <input
        type="text"
        autoComplete="off"
        placeholder={placeholder || undefined}
        className={`placeholder:italic focus:shadow-outline w-full min-w-[20ch] resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-2 px-3 leading-tight text-white shadow focus:border-primary focus:bg-slate-900 focus:outline-none`}
        {...register(name)}
      />
    </div>
  )
}

const Profile = () => {
  const pubkey = useSettingsStore(state => state.pubkey)
  const profile = useProfile(pubkey)

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useZodForm({
    mode: 'onSubmit',
    schema: z.object({
      name: z.string().optional(),
      display_name: z.string().optional(),
      picture: z.union([z.literal(""), z.string().trim().url()]),
      about: z.string().optional(),
      website: z.union([z.literal(""), z.string().trim().url()]),
      banner: z.union([z.literal(""), z.string().trim().url()]),
      lud06: z.string().optional(),
      lud16: z.string().optional(),
      nip05: z.string().optional()
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

  const onSubmit = (data: any) => {
    console.log('data', data)
    // TODO: filter out any empty values ('') for event
    // don't need to populate a bunch of empty strings...
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
    reset({...profile})
  }, [profile])

  if (!profile) return <div>nada</div>

  return (
    <div className="flex w-3/5 flex-col gap-4">
      <h2 className="font-md mb-2 text-xl">Profile</h2>
      <div className="flex flex-col px-6 py-4 gap-4 rounded border border-gray-500 bg-stone-800">
        <form className="flex flex-col gap-2" spellCheck={false} onSubmit={handleSubmit(onSubmit)}>
          <Input label={"Your Name"} name={'name'} register={register} />
          <Input label={"Display Name"} name={"display_name"} register={register} />
          <Input label={"Picture URL"} name={"picture"} register={register} />
          <Input label={"About"} name={"about"} register={register} />
          <Input label={"Website"} name={'website'} placeholder={"https://example.com"} register={register} />
          <Input label={"Banner URL"} name={'banner'} register={register} />
          <Input label={"LNURLPay"} name={'lud06'} placeholder={"LNURL1DP68GURN8GHJ7AMPD3KX2AR0VEE..."} register={register} />
          <Input label={"Lightning Address"} name={'lud16'} placeholder={"name@getalby.com"} register={register} />
          <Input label={"Nip05 Verification"} name={'nip05'} placeholder={"name@nostrplebs.com"} register={register} />
        </form>

        <div className="flex justify-end">
          <button 
            type="submit"
            className="align-right inline-flex h-8 w-32 items-center justify-center rounded bg-primary px-2 py-1 text-sm font-semibold shadow-md transition duration-150 ease-in-out hover:bg-primary hover:shadow-lg focus:bg-primary focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary active:shadow-lg"
            onClick={handleSubmit(onSubmit)}
          >
            Submit
          </button>
        </div>
      </div>
    </div>

  )
}

export default Profile