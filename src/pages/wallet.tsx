import useAuthStore from '~/hooks/useAuthStore'
import { Spinner } from '~/components/Spinner'
import { trpc } from '~/utils/trpc'
import { format } from 'date-fns'
import { standardDateFormat } from '~/utils/date'

export default function Wallet() {
  const { user, setUser, status: authStatus } = useAuthStore()
  const { data: transactionData } = trpc.accounting.transactions.useQuery(undefined, { enabled: !!user })

  if (authStatus === 'unauthenticated') {
    return <p>You must be logged in to view this page</p>
  }

  if (!user && authStatus === 'loading') {
    return (
      <div className={'w-full text-center'}>
        <Spinner />
      </div>
    )
  }
  console.log(transactionData)

  return (
    <div className={'no-scrollbar max-h-600 overflow-y-scroll'}>
      <div>My transactions:</div>
      {transactionData
        ? transactionData.map((transaction) => {
            return (
              <div
                key={transaction.id}
                className={
                  'my-2 flex flex-row rounded-tl-lg border-2 border-gray-400 p-1 text-sm transition duration-150 ease-in-out hover:-translate-y-1 hover:drop-shadow-lg'
                }
              >
                <div className={'w-80'}>
                  <div>
                    <b>To:</b>
                    {/* {transaction.toUser?.id === user?.id?  */}
                    {transaction.toUserId === transaction.fromUserId ? (
                      <span> me</span>
                    ) : (
                      <span> {transaction.toUser?.userName}</span>
                    )}
                  </div>
                  <div className={'flex flex-row gap-1'}>
                    <div>
                      <b>amount:</b>
                      {transaction.mSatsTarget}
                    </div>
                    <div>
                      <b>status:</b>
                      {transaction.transactionStatus}
                    </div>
                  </div>
                </div>
                <div>
                  <div>
                    <b>kind:</b>
                    {transaction.transactionKind}
                  </div>
                  <div>
                    <b>created:</b>
                    {format(transaction.createdAt ?? 0, standardDateFormat)}
                  </div>
                </div>
              </div>
            )
          })
        : 'you do not have any transactions yet...'}
    </div>
  )
}
