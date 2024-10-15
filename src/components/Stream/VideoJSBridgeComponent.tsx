import React from 'react'
import videojs from 'video.js'
import * as ReactDOM from 'react-dom/client'
import CustomModalComponent from './CustomModalComponent'
import { Lsat } from 'lsat-js'

const VjsComponent = videojs.getComponent('Component')

// TODO:
// VideoJSBridgeComponent.tsx:23 Warning: Attempted to synchronously unmount a root while React was already rendering. React cannot finish unmounting the root until the current render has completed, which may lead to a race condition.
// at VideoJS (webpack-internal:///./src/components/Stream/VideoJS.tsx:26:25)
// at VideoPlayer (webpack-internal:///./src/components/Stream/Player.tsx:26:25)
class VideoJSBridgeComponent extends VjsComponent {
  private root: ReactDOM.Root | null = null
  private showModal: boolean = false
  private paymentCallback: (l402: Lsat) => void

  constructor(player: videojs.Player, options: any) {
    super(player, options)
    this.paymentCallback = options.paymentCallback

    // When player is ready, call method to mount the React component
    player.ready(() => {
      this.mountReactComponent()
    })

    // Remove the React root when this component is destroyed
    this.on('dispose', () => {
      if (this.root) {
        this.root.unmount()
      }
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
}

// Register the Video.js component
// videojs.registerComponent('videoJSBridgeComponent', VideoJSBridgeComponent)

export default VideoJSBridgeComponent
