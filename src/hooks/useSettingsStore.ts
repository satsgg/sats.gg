import create from 'zustand'
import SettingsStore from '~/store/settingsStore'

const useSettingsStore = create(SettingsStore)

export default useSettingsStore
