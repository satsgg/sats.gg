import { ScrollArea } from '~/components/ui/scroll-area'
import { Bell, CheckCircle2, XCircle } from 'lucide-react'

interface StreamNotification {
  id: string
  type: 'live_note_published' | 'ended_note_published'
  title: string
  message: string
  read: boolean
  relayResults?: {
    success: number
    total: number
  }
}

export default function Notifications({
  notifications,
  setNotifications,
}: {
  notifications: StreamNotification[]
  setNotifications: (notifications: StreamNotification[]) => void
}) {
  return (
    <div className="w-80 overflow-y-auto border-l border-border">
      <h2 className="flex items-center justify-center border-b border-border p-3 text-lg font-semibold">
        <Bell className="mr-2 h-5 w-5" /> Notifications
      </h2>
      <ScrollArea className="h-[calc(100vh-8rem)] p-4">
        {/* {[...Array(10)].map((_, i) => ( */}
        {/* {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`mb-4 rounded p-3 shadow ${
              notification.read ? 'bg-gray-50' : 'border-l-4 border-blue-500 bg-white'
            }`}
          >
            <h3 className="font-semibold">{notification.title}</h3>
            <p className="mb-2 text-sm text-gray-600">{notification.message}</p>
            {notification.type === 'note_published' && notification.relayResults && (
              <div className="flex items-center text-sm">
                <div className="mr-3 flex items-center text-green-600">
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  <span>{notification.relayResults.success}</span>
                </div>
                <div className="flex items-center text-red-600">
                  <XCircle className="mr-1 h-4 w-4" />
                  <span>{notification.relayResults.total - notification.relayResults.success}</span>
                </div>
              </div>
            )}
          </div>
        ))} */}
      </ScrollArea>
    </div>
  )
}
