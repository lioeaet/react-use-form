import { createBrowserRouter } from 'react-router-dom'
import { IndexForm } from './examples/IndexForm'
import { ArrayInArray } from './examples/ArrayInArray'
import { DeepArrayForm } from './examples/DeepArrayForm'

const router = createBrowserRouter([
  {
    path: '/',
    element: <IndexForm />,
  },
  {
    path: '/array-in-array',
    element: <ArrayInArray />,
  },
  {
    path: '/deep-array',
    element: <DeepArrayForm />,
  },
])

export default router
