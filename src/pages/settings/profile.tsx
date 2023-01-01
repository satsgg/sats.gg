import { useState } from 'react'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import { trpc } from '~/utils/trpc'
import { AppRouter } from '~/server/routers/_app'
import { inferProcedureInput, inferProcedureOutput } from '@trpc/server'
import Resizer from 'react-image-file-resizer'
import useAuthStore from '~/store/useAuthStore'
import { Spinner } from '~/components/Spinner'
import IsLoadingSVG from '~/svgs/is-loading.svg'
import CheckmarkSVG from '~/svgs/checkmark.svg'
import ClipboardSVG from '~/svgs/clipboard.svg'

type EditUserInput = inferProcedureInput<AppRouter['user']['edit']>
type UpdateUserInput = inferProcedureInput<AppRouter['user']['updateProfilePic']>
type GetMeOutput = inferProcedureOutput<AppRouter['auth']['getMe']>

export const editUserInput = z.object({
  userName: z.string().min(4).max(24).optional(),
  bio: z.string().max(256).optional(),
})

export const updateProfilePicInput = z.object({
  base64EncodedImage: z.string().optional(),
})

const ProfileSettings = ({ user }: GetMeOutput) => {
  const { setUser, storeLogin } = useAuthStore()
  const [base64EncodedImage, setBase64EncodedImage] = useState<string | undefined>(user?.profileImage ?? undefined)
  const [showCopied, setShowCopied] = useState(false)
  const [showCopiedURL, setShowCopiedURL] = useState(false)

  const editUserMutation = trpc.user.edit.useMutation()
  const updateProfilePicMutation = trpc.user.updateProfilePic.useMutation()
  const refreshStreamKeyMutation = trpc.user.refreshStreamKey.useMutation()
  const utils = trpc.useContext()
  const rtmpUrl = 'rtmp://global-live.mux.com:5222/app'

  const handleStreamKeyClick = async () => {
    await navigator.clipboard.writeText(user.streamKey)
    setShowCopied(true)
    setTimeout(() => {
      setShowCopied(false)
    }, 2000)
  }

  const handleURLClick = async () => {
    await navigator.clipboard.writeText(rtmpUrl)
    setShowCopiedURL(true)
    setTimeout(() => {
      setShowCopiedURL(false)
    }, 2000)
  }
  // TODO:
  // If they aren't logged in and access this route,
  // 1. show You must be logged in to view this page
  // 2. open up the login modal on top
  // This goes for any page that requires auth... need to make it reusable or something

  const {
    register,
    handleSubmit,
    // getValues,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useZodForm({
    schema: editUserInput,
    defaultValues: {
      userName: user?.userName,
      bio: user?.bio ?? '',
    },
  })

  const {
    // register: registerProfilePic,
    handleSubmit: handleProfilePicSubmit,
    // getValues,
    // setValue: setProfilePic,
    // watch,
    // reset,
    formState: { errors: profilePicErrors },
  } = useZodForm({
    schema: updateProfilePicInput,
    defaultValues: {
      base64EncodedImage: user?.profileImage ?? '',
    },
  })
  console.log('formstate', errors)

  const resizeFile = (file: any) =>
    new Promise<string>((resolve) => {
      Resizer.imageFileResizer(
        file,
        250,
        250,
        'JPEG',
        100,
        0,
        (uri) => {
          resolve(uri as string)
        },
        'base64',
      )
    })

  const onSubmit = async (data: EditUserInput) => {
    const newUserToken = await editUserMutation.mutateAsync({ ...data })
    // this ends up refreshing all components since everything depends on it...
    // but only way to change the token for the chat server
    // other option is to query dbs
    storeLogin(newUserToken.user)
    await utils.invalidate()
    // utils.auth.getMe.fetch().then((res) => {
    //   setUser(res)
    // })
  }

  // const onProfilePicSubmit = async (data: UpdateUserInput) => {
  //   console.log('onProfilePicSubmit data', data)
  //   await updateProfilePicMutation.mutateAsync({ ...data })
  //   await utils.invalidate()
  //   utils.auth.getMe.fetch().then((res) => {
  //     setUser(res)
  //   })
  // }

  const onProfilePicSubmit = async (e) => {
    await updateProfilePicMutation.mutateAsync({ base64EncodedImage: base64EncodedImage })
    await utils.invalidate()
    utils.auth.getMe.fetch().then((res) => {
      setUser(res)
    })
  }

  const onSubmitRefreshStreamKey = async () => {
    const res = await refreshStreamKeyMutation.mutateAsync()
    await utils.invalidate()
    utils.auth.getMe.fetch().then((res) => {
      setUser(res)
    })
  }

  // TODO:
  // Auto submit profile pic change
  // remove profile pic update from Save Changes
  // disable Save Changes button if no changes
  // don't let user submit empty userName
  // handle form errors
  // lots of styling fixes needed...

  return (
    <div className="w-full bg-stone-900 py-10 px-8 text-white">
      <h1 className="mb-6 border-b border-gray-500 pb-4 text-4xl font-bold">Settings</h1>
      <div className="flex w-3/5 flex-col gap-8">
        <div>
          <h2 className="font-md mb-2 text-xl">Profile Picture</h2>
          <div className="flex rounded border border-gray-500 bg-stone-800">
            <form className="flex p-6" onSubmit={handleProfilePicSubmit(onProfilePicSubmit)}>
              <div className="mr-6">
                <img
                  id={'edit-user-profileImage'}
                  src={base64EncodedImage}
                  // src={getValues('base64EncodedImage')}
                  alt={`Profile image of ${user?.userName}`}
                  className="h-24 w-24 rounded-[50%]"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="file"
                  // {...registerProfilePic('base64EncodedImage', {
                  //   required: true,
                  //   onChange: async (e) => {
                  //     if (e.target.files) {
                  //       const img = await resizeFile(e.target.files[0])
                  //       console.log('setting', img)
                  //       // setBase64EncodedImage(await resizeFile(e.target.files[0]))
                  //       setProfilePic('base64EncodedImage', img)
                  //       // setBase64EncodedImage(img)
                  //       console.log('set', img)
                  //     }
                  //   },
                  //   onBlur: async(e) => {
                  //     console.log('blur', e.target.files[0])
                  //   }
                  // })}
                  onChange={async (e) => {
                    if (e.target.files) {
                      setBase64EncodedImage(await resizeFile(e.target.files[0]))
                      // setProfilePic("base64EncodedImage", await resizeFile(e.target.files[0]))
                      // console.log('values', getValues())
                      // console.log('user', user)
                      // handleSubmit(o)
                      // await onProfilePicSubmit({base64EncodedImage: await resizeFile(e.target.files[0])})
                      // handleProfilePicSubmit(onProfilePicSubmit)
                    }
                  }}
                  className="block align-middle text-sm text-slate-500
                    file:mr-4 file:rounded file:border-0
                    file:bg-primary file:py-2
                    file:px-4 file:text-sm
                    file:font-semibold file:text-white
                    hover:file:cursor-pointer hover:file:opacity-90"
                  id="fileupload"
                />
              </div>
            </form>
            <div className="flex items-center justify-center">
              <button
                type="submit"
                className={`${
                  profilePicErrors.base64EncodedImage ? 'bg-gray-500' : ''
                } align-right inline-flex h-8 w-32 items-center justify-center rounded bg-primary px-3 py-2 text-sm font-semibold shadow-md transition duration-150 ease-in-out hover:bg-primary hover:shadow-lg focus:bg-primary focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary active:shadow-lg`}
                disabled={profilePicErrors.base64EncodedImage ? true : false}
                onClick={onProfilePicSubmit}
              >
                {updateProfilePicMutation.isLoading ? (
                  <IsLoadingSVG width={24} height={24} className="animate-spin" strokeWidth={2} />
                ) : (
                  'Save Image'
                )}
              </button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-md mb-2 text-xl">Profile Settings</h2>

          <div className="rounded border border-gray-500 bg-stone-800 p-6">
            <form spellCheck={false} className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex">
                <div className="w-1/4">
                  <p>Username</p>
                </div>
                <div className="w-3/4">
                  <input
                    id={'edit-user-userName'}
                    {...register('userName', { required: true })}
                    type="text"
                    autoComplete="off"
                    className={`
                      ${errors.userName ? 'border-red-700 focus:border-red-700' : ''}
                      form-control
                      m-0
                      block
                      w-full
                      rounded
                      border
                      border-solid
                      border-gray-500
                      bg-stone-700
                      bg-clip-padding
                      px-2 py-1 text-sm
                      font-normal
                      text-white
                      transition
                      ease-in-out focus:border-primary focus:bg-slate-900 focus:outline-none
                    `}
                  />
                  <p className="mt-1 text-sm font-thin">Username must be between 4 and 25 characters</p>
                </div>
              </div>
              <div className="flex">
                <div className="w-1/4">
                  <p>Bio</p>
                </div>
                <div className="w-3/4">
                  <textarea
                    className={`${
                      errors.bio ? 'border-red-700 focus:border-red-700' : ''
                    } focus:shadow-outline w-full resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-2 px-3 leading-tight text-white shadow focus:border-primary focus:bg-slate-900 focus:outline-none`}
                    id="userBio"
                    autoComplete="off"
                    rows={3}
                    {...register('bio', { required: true })}
                  />
                  <p className="text-sm font-thin">
                    Description for the About panel on your channel page with no more than 256 characters
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className={`${
                    errors.bio || errors.userName ? 'bg-gray-500' : ''
                  } align-right inline-flex h-8 w-32 items-center justify-center rounded bg-primary px-2 py-1 text-sm font-semibold shadow-md transition duration-150 ease-in-out hover:bg-primary hover:shadow-lg focus:bg-primary focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary active:shadow-lg`}
                  // className="inline-flex w-32 items-center justify-center rounded bg-primary py-1 px-2 text-sm font-semibold text-white"
                  disabled={errors.bio || errors.userName ? true : false}
                >
                  {editUserMutation.isLoading ? (
                    <IsLoadingSVG width={24} height={24} className="animate-spin" strokeWidth={2} />
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div>
          <h2 className="font-md mb-2 text-xl">Stream Settings</h2>
          <div className="flex flex-col gap-y-6 rounded border border-gray-500 bg-stone-800 p-6">
            <div className="flex">
              <div className="w-1/4">
                <p>Stream Key</p>
              </div>
              <div className="flex w-3/4 gap-x-4">
                <div className="flex w-full">
                  <input
                    type="button"
                    className="w-full min-w-0 rounded-l border-2 border-r-0 border-gray-500 bg-stone-700 p-1 focus:border-primary focus:bg-slate-900"
                    onClick={handleStreamKeyClick}
                    value={user.streamKey}
                  />
                  <button className="rounded-r bg-primary p-2 text-white" onClick={handleStreamKeyClick}>
                  {showCopied ? (
                    <CheckmarkSVG width={24} height={24} strokeWidth={1.5} />
                  ) : (
                    <ClipboardSVG width={24} height={24} strokeWidth={1.5} />
                  )}
                  </button>
                </div>
                <button
                  className="inline-flex w-32 items-center justify-center rounded bg-primary py-1 px-2 text-sm font-semibold text-white"
                  disabled={refreshStreamKeyMutation.isLoading}
                  onClick={onSubmitRefreshStreamKey}
                >
                  {refreshStreamKeyMutation.isLoading ? (
                    <IsLoadingSVG width={24} height={24} className="animate-spin" strokeWidth={2} />
                  ) : (
                    'Refresh Key'
                  )}
                </button>
              </div>
            </div>
            <div className="flex">
              <div className="w-1/4">
                <p>RTMP URL</p>
              </div>
              <div className="flex w-3/4">
                <input
                  type="button"
                  className="w-full min-w-0 rounded-l border-2 border-r-0 border-gray-500 bg-stone-700 p-1 focus:border-primary focus:bg-slate-900"
                  onClick={handleURLClick}
                  value={rtmpUrl}
                />
                <button className="rounded-r bg-primary p-2 text-white" onClick={handleURLClick}>
                  {showCopiedURL ? (
                    <CheckmarkSVG width={24} height={24} strokeWidth={1.5} />
                  ) : (
                    <ClipboardSVG width={24} height={24} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfileSettingsWrapper({}) {
  const { user, setUser, status: authStatus } = useAuthStore()

  if (authStatus === 'unauthenticated') {
    return <p>You must be logged in to view this page</p>
  }

  if (user) {
    return <ProfileSettings user={user} setUser={setUser} />
  }

  return (
    <div className={'w-full text-center'}>
      <Spinner />
    </div>
  )
}
