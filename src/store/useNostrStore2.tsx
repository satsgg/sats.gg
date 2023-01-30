import create from 'zustand'
import nostrStore from '~/store/nostrStore2'

const useNostrStore = create(nostrStore)

export default useNostrStore
