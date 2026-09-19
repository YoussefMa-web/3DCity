import './style.css'
import { CampusApp } from './scene/CampusApp'

const canvas = document.querySelector<HTMLCanvasElement>('#scene')
if (!canvas) throw new Error('Canvas missing')
new CampusApp(canvas)
