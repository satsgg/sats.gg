import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'
import * as ReactDOM from 'react-dom/client'
import TitleOverlayContent from './TitleOverlayContent'

interface TitleOverlayOptions {
  title?: string
  profilePicUrl?: string
  children?: any[]
  className?: string
}

const VjsComponent = videojs.getComponent('Component')

class TitleOverlay extends VjsComponent {
  private root: ReactDOM.Root | null = null
  declare options_: TitleOverlayOptions
  private unmountScheduled: boolean = false

  constructor(player: Player, options: TitleOverlayOptions = {}) {
    super(player, options)

    console.log('TitleOverlay constructor', options)

    // Mount React component when player is ready
    player.ready(() => {
      this.mountReactComponent()
    })

    // Handle visibility based on player events
    player.on('useractive', () => {
      this.show()
    })
    player.on('userinactive', () => {
      this.hide()
    })

    this.on('dispose', () => {
      this.scheduleUnmount()
    })
  }

  createEl() {
    return videojs.dom.createEl('div', {
      className: 'vjs-title-overlay-container',
    })
  }

  mountReactComponent() {
    this.root = ReactDOM.createRoot(this.el())
    this.updateComponent()
  }

  updateComponent() {
    if (this.root) {
      // Only show if we have both title and profilePicUrl
      if (this.options_.title && this.options_.profilePicUrl) {
        this.root.render(
          <TitleOverlayContent title={this.options_.title} profilePicUrl={this.options_.profilePicUrl} />,
        )
        this.show()
      } else {
        // If either is missing, render nothing and hide
        this.root.render(null)
        this.hide()
      }
    }
  }

  update(options?: Partial<TitleOverlayOptions>) {
    if (options) {
      console.log('TitleOverlay update with options:', options)
      this.options_ = { ...this.options_, ...options }
      this.updateComponent()
    }
    return this
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

  show() {
    console.log('TitleOverlay show')
    if (this.el_) {
      super.show()
      this.el_.style.opacity = '1'
      this.el_.style.visibility = 'visible'
    }
  }

  hide() {
    console.log('TitleOverlay hide')
    if (this.el_) {
      super.hide()
      this.el_.style.opacity = '0'
      this.el_.style.visibility = 'hidden'
    }
  }
}

export default TitleOverlay
