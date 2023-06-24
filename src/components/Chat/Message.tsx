import { fmtMsg } from '~/utils/util'

const Message = ({ content }: { content: string }) => {
  return <span className="text-sm text-white">{fmtMsg(content)}</span>
}

export default Message
