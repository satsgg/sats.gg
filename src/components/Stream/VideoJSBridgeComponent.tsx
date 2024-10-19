import React from 'react'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'
import * as ReactDOM from 'react-dom/client' // don't install the types it breaks everything
import CustomModalComponent from './CustomModalComponent'
import { Lsat } from 'lsat-js'

const VjsComponent = videojs.getComponent('Component')

class VideoJSBridgeComponent extends VjsComponent {
  private root: ReactDOM.Root | null = null
  private showModal: boolean = false
  private paymentCallback: (l402: Lsat) => void
  private unmountScheduled: boolean = false

  constructor(player: Player, options: any) {
    super(player, options)
    this.paymentCallback = options.paymentCallback

    // When player is ready, call method to mount the React component
    player.ready(() => {
      this.mountReactComponent()
    })

    this.on('dispose', () => {
      this.scheduleUnmount()
    })
  }

  createEl() {
    return videojs.dom.createEl('div', {
      className: 'vjs-custom-modal-container',
    })
  }

  // This method renders the CustomModalComponent into the DOM element of
  // the Video.js component, `this.el()`.
  mountReactComponent() {
    this.root = ReactDOM.createRoot(this.el())
    this.updateComponent()
  }

  updateComponent() {
    if (this.root) {
      this.root.render(
        <CustomModalComponent
          vjsBridgeComponent={this}
          paymentCallback={this.paymentCallback}
          show={this.showModal}
          onClose={() => this.toggleModal()}
        />,
      )
    }
  }

  // Method to toggle modal visibility
  toggleModal() {
    this.showModal = !this.showModal
    this.updateComponent()
  }

  openModal() {
    this.showModal = true
    this.updateComponent()
  }

  scheduleUnmount() {
    if (!this.unmountScheduled) {
      this.unmountScheduled = true
      Promise.resolve().then(() => {
        if (this.root) {
          this.root.unmount()
          this.root = null
        }
      })
    }
  }
}

// Register the Video.js component
// videojs.registerComponent('videoJSBridgeComponent', VideoJSBridgeComponent)

export default VideoJSBridgeComponent
