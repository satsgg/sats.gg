const Input = ({
  name,
  placeholder,
  error,
  register,
  rows = 1,
}: {
  name: string
  placeholder?: string
  error?: boolean
  register: Function
  rows?: number
}) => {
  return (
    <>
      {rows > 1 ? (
        <textarea
          autoComplete="off"
          placeholder={placeholder || undefined}
          className={`${error ? 'focus:border-red-600' : 'focus:border-primary-500'}
          focus:shadow-outline w-full min-w-[20ch] resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-2 px-3 leading-tight text-white shadow placeholder:italic focus:border-primary-500 focus:bg-slate-900 focus:outline-none`}
          spellCheck={false}
          rows={rows}
          {...register(name)}
        />
      ) : (
        <input
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder || undefined}
          className={`${error ? 'focus:border-red-600' : 'focus:border-primary-500'}
          focus:shadow-outline w-full min-w-[20ch] resize-none appearance-none rounded border border-gray-500 bg-stone-700 py-2 px-3 leading-tight text-white shadow placeholder:italic focus:bg-slate-900 focus:outline-none`}
          {...register(name)}
        />
      )}
    </>
  )
}

export default Input
