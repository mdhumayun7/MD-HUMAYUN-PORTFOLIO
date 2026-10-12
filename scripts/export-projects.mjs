import { projects } from '../src/data/projects.js'
console.log(JSON.stringify(projects.map(({ id, title, tagline, discipline, metrics }) => ({ id, title, tagline, discipline, metrics: (metrics || []).slice(0, 3) }))))
