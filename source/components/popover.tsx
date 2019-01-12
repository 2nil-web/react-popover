import * as Forto from "forto"
import * as React from "react"
import * as ReactDOM from "react-dom"
import { window, document } from "../lib/platform"
import { noop, createHTMLRef, HTMLRef } from "../lib/utils"
import FortoPop from "./forto"
import Transition from "./transition"

type Props = {
  body: React.ReactNode
  children: React.ReactElement<any>
  appendTarget: Element
  isOpen: boolean
  place: Forto.Settings.SettingsUnchecked["elligibleZones"]
  preferPlace: Forto.Settings.SettingsUnchecked["preferredZones"]
  refreshIntervalMs: null | number
  tipSize: number
  frame: Window | HTMLRef
  onOuterAction(event: MouseEvent | TouchEvent): void
}

type State = {
  target: HTMLRef
  popover: React.RefObject<FortoPop>
}

class Popover extends React.Component<Props, State> {
  static defaultProps = {
    frame: window,
    tipSize: 7,
    preferPlace: null,
    place: null,
    isOpen: false,
    onOuterAction: noop,
    children: null,
    refreshIntervalMs: 200,
    appendTarget: document ? document.body : null,
  }

  state = {
    target: createHTMLRef(),
    popover: React.createRef<FortoPop>(),
  }

  componentDidMount() {
    this.outerActionTrackingStart()
    this.setState({
      target: {
        current: ReactDOM.findDOMNode(this) as HTMLElement,
      },
    })
  }

  componentWillUnmount() {
    this.outerActionTrackingStop()
  }

  /**
   * Check if a user tap/click occured outside this popover
   * and its target, and if so trigger a callback. This is convenient
   * for users to implement logic like "close popover upon
   * outer action".
   */
  checkForOuterAction = (event: MouseEvent | TouchEvent) => {
    if (
      // Event occured against an HTML Element
      event.target &&
      event.target instanceof Element &&
      // Refs are loaded
      this.state.target.current &&
      this.state.popover.current &&
      this.state.popover.current!.popoverRef.current &&
      // Event occured outside of the arrangement
      !(
        this.state.target.current!.contains(event.target as Element) ||
        this.state.popover.current!.popoverRef.current!.contains(
          event.target as Element,
        )
      )
    )
      this.props.onOuterAction(event)
  }

  /**
   * Track user actions on the page. Anything that occurs _outside_
   * the Popover boundaries should close the Popover.
   */
  outerActionTrackingStart = () => {
    if (document) {
      document.addEventListener("mousedown", this.checkForOuterAction)
      document.addEventListener("touchstart", this.checkForOuterAction)
    }
  }

  outerActionTrackingStop = () => {
    if (document) {
      document.removeEventListener("mousedown", this.checkForOuterAction)
      document.removeEventListener("touchstart", this.checkForOuterAction)
    }
  }

  render() {
    const {
      isOpen,
      children,
      appendTarget,
      frame,
      ...fortoPopProps
    } = this.props

    const resolvedFrame =
      this.props.frame instanceof Window
        ? this.props.frame
        : this.props.frame.current
        ? this.props.frame.current
        : null

    const popover = (
      <Transition>
        {isOpen && this.state.target.current && resolvedFrame ? (
          <FortoPop
            {...fortoPopProps}
            frame={resolvedFrame}
            target={this.state.target.current}
            ref={this.state.popover}
          />
        ) : null}
      </Transition>
    )

    return [children, ReactDOM.createPortal(popover, appendTarget)]
  }
}

export default Popover
