import Profile from './Profile'

const Settings = () => {
  return (
    <div className="w-full bg-stone-900 py-10 px-8 text-white">
      <h1 className="mb-6 border-b border-gray-500 pb-4 text-4xl font-bold">Settings</h1>
      {/* TABS */}
      <Profile />
    </div>
  )
}

export default Settings