import create from 'zustand'
import nostrStore from '~/store/nostrStore'

const useNostrStore = create(nostrStore)

export default useNostrStore
