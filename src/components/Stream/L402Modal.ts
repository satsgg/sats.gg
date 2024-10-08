import videojs from 'video.js'

const registerPlugin = () => {
  const Plugin = videojs.getPlugin('plugin')
  const ModalDialog = videojs.getComponent('ModalDialog')

  class L402Modal extends Plugin {
    private modal: any
    private options: any

    constructor(player: any, options: any) {
      super(player, options)

      this.options = videojs.mergeOptions(
        {
          content: 'Please pay to continue watching.',
          paymentAmount: 0,
          paymentUnit: 'sats',
          paymentCallback: null,
        },
        options,
      )

      this.player.ready(() => {
        this.init()
      })
    }

    init() {
      this.createModal()
      this.player.on('l402required', this.showModal.bind(this))
    }

    createModal() {
      this.modal = new ModalDialog(this.player, {
        content: this.createModalContent(),
        description: 'L402 Payment Required',
        fillAlways: true,
        uncloseable: true,
      })

      this.player.addChild(this.modal)
    }

    createModalContent() {
      const contentEl = videojs.dom.createEl('div', {
        className: 'vjs-l402-modal-content',
      })

      const messageEl = videojs.dom.createEl('p', {
        innerHTML: this.options.content,
      })

      const paymentInfoEl = videojs.dom.createEl('p', {
        innerHTML: `Payment required: ${this.options.paymentAmount} ${this.options.paymentUnit}`,
      })

      const payButton = videojs.dom.createEl('button', {
        innerHTML: 'Pay Now',
        className: 'vjs-l402-pay-button',
      })

      payButton.addEventListener('click', () => {
        if (typeof this.options.paymentCallback === 'function') {
          this.options.paymentCallback()
        }
      })

      contentEl.appendChild(messageEl)
      contentEl.appendChild(paymentInfoEl)
      contentEl.appendChild(payButton)

      return contentEl
    }

    showModal() {
      this.modal.open()
    }

    hideModal() {
      this.modal.close()
    }

    updatePaymentInfo(amount: number, unit: string) {
      this.options.paymentAmount = amount
      this.options.paymentUnit = unit
      this.modal.content(this.createModalContent())
    }
  }

  videojs.registerPlugin('l402Modal', L402Modal)
  console.log('L402Modal plugin registered')
}

// Check if we're in a browser environment before registering the plugin
if (typeof window !== 'undefined' && window.videojs) {
  registerPlugin()
}

export default registerPlugin
