import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {

  async function handleSubmit(formData) {
    if(formData.get("EssayTxt") == null){
      let url = "http://localhost:3000/"  
    } else{
      let url = "http://localhost:3000/file"
    }
    try{
      const response = fetch(url)
    }catch(e) {
      console.log(e)
    }
    


    return
  }

  return (
    <>
      <h1>
        Essay-Grader
      </h1>

      <form action={() => handleSubmit}>
        <label for='topic'>Podaj Treść tematu rozprawki</label><br/>
        <input name='topic' id='topic' /><br/>
        <label for='EssayText'>Podaj Treść Rozprawki</label><br/>
        <textarea name='EssayText' id='EssayText'></textarea><br/>
        <label for='EssayTxt'>Lub wybierz plik</label><br/>
        <input name='EssayTxt' id='EssayTxt' type='file'/><br/>
        <button type='submit'>Sprawdź</button>
      </form>

    </>
  )
}

export default App
