import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1 class="text-3xl font-bold underline border-4 border-red-500">
        Hello world!
      </h1>
    </>
  )
}

export default App
