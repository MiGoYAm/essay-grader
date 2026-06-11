import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {

async function handleSubmit(formData) {
  let url;

  if (formData.get("EssayTxt") == null) {
    url = "http://localhost:3000/";
  } else {
    url = "http://localhost:3000/file";
  }
  console.log(formData)
  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData 
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    console.log(result);

  } catch (e) {
    console.log(e);
  }
}



  return (
    <div class="container">
      <h1>
        Essay-Grader
      </h1>
      <form action={handleSubmit}>
        <label for='topic'>Podaj Treść tematu rozprawki</label><br/>
        <input name='topic' id='topic' /><br/>
        <label for='text'>Podaj Treść Rozprawki</label><br/>
        <textarea name='text' id='text'></textarea><br/>
        <label for='file'>Lub wybierz plik</label><br/>
        <input name='file' id='file' type='file'/><br/>
        <button type='submit'>Sprawdź</button>
      </form>
      <div>

      </div>
    </div>
  )
}

export default App
