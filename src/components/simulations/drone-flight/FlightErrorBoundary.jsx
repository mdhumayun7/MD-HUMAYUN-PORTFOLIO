import { Component } from 'react'

// ===========================================================================
//  ERROR BOUNDARY
//  If the 3D scene throws (a context loss, a driver quirk, anything), this
//  catches it so the failure is contained to this one demo -- the rest of
//  the portfolio, including the research benchmark demo beside it, keeps
//  working.
// ===========================================================================
export class FlightErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Flight simulation failed to render:', error, info)
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
