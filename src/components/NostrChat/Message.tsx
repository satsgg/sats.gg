// TODO: Move max message length to config file
const maxMsgLen = 200

const Message = ({ content }: { content: string }) => {
  const fmtMsg = (content: string) => {
    if (content.length > maxMsgLen) {
      return content.slice(0, maxMsgLen).trim() + '...'
    }
    return content
  }
  return <span className="text-sm text-gray-300">{fmtMsg(content)}</span>
}

export default Message
