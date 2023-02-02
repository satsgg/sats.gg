import create from 'zustand'
import settingsStore from '~/store/settingsStore'

const useSettingsStore = create(settingsStore)

export default useSettingsStore
