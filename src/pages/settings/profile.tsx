import { useState } from 'react'
import { useZodForm } from '~/utils/useZodForm'
import { z } from 'zod'
import { trpc } from '~/utils/trpc'
import { AppRouter } from '~/server/routers/_app'
import { inferProcedureInput, inferProcedureOutput } from '@trpc/server'
import Resizer from 'react-image-file-resizer'
import useAuthStore from '~/store/useAuthStore'
import { Spinner } from '~/components/Spinner'

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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 animate-spin"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.64 9.788a.75.75 0 01.53.918 5 5 0 007.33 5.624.75.75 0 11.75 1.3 6.501 6.501 0 01-9.529-7.312.75.75 0 01.919-.53zM8.75 6.37a6.5 6.5 0 019.529 7.312.75.75 0 11-1.45-.388A5.001 5.001 0 009.5 7.67a.75.75 0 11-.75-1.3z"
                      clipRule="evenodd"
                    />
                    <path
                      fillRule="evenodd"
                      d="M5.72 9.47a.75.75 0 011.06 0l2.5 2.5a.75.75 0 11-1.06 1.06l-1.97-1.97-1.97 1.97a.75.75 0 01-1.06-1.06l2.5-2.5zM14.72 10.97a.75.75 0 011.06 0l1.97 1.97 1.97-1.97a.75.75 0 111.06 1.06l-2.5 2.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 010-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-6 w-6 animate-spin"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.64 9.788a.75.75 0 01.53.918 5 5 0 007.33 5.624.75.75 0 11.75 1.3 6.501 6.501 0 01-9.529-7.312.75.75 0 01.919-.53zM8.75 6.37a6.5 6.5 0 019.529 7.312.75.75 0 11-1.45-.388A5.001 5.001 0 009.5 7.67a.75.75 0 11-.75-1.3z"
                        clipRule="evenodd"
                      />
                      <path
                        fillRule="evenodd"
                        d="M5.72 9.47a.75.75 0 011.06 0l2.5 2.5a.75.75 0 11-1.06 1.06l-1.97-1.97-1.97 1.97a.75.75 0 01-1.06-1.06l2.5-2.5zM14.72 10.97a.75.75 0 011.06 0l1.97 1.97 1.97-1.97a.75.75 0 111.06 1.06l-2.5 2.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 010-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-6 w-6"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-6 w-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  className="inline-flex w-32 items-center justify-center rounded bg-primary py-1 px-2 text-sm font-semibold text-white"
                  disabled={refreshStreamKeyMutation.isLoading}
                  onClick={onSubmitRefreshStreamKey}
                >
                  {refreshStreamKeyMutation.isLoading ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-6 w-6 animate-spin"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.64 9.788a.75.75 0 01.53.918 5 5 0 007.33 5.624.75.75 0 11.75 1.3 6.501 6.501 0 01-9.529-7.312.75.75 0 01.919-.53zM8.75 6.37a6.5 6.5 0 019.529 7.312.75.75 0 11-1.45-.388A5.001 5.001 0 009.5 7.67a.75.75 0 11-.75-1.3z"
                        clipRule="evenodd"
                      />
                      <path
                        fillRule="evenodd"
                        d="M5.72 9.47a.75.75 0 011.06 0l2.5 2.5a.75.75 0 11-1.06 1.06l-1.97-1.97-1.97 1.97a.75.75 0 01-1.06-1.06l2.5-2.5zM14.72 10.97a.75.75 0 011.06 0l1.97 1.97 1.97-1.97a.75.75 0 111.06 1.06l-2.5 2.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 010-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-6 w-6"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-6 w-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                      />
                    </svg>
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
