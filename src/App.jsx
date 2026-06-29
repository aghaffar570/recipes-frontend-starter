import { useState, useEffect } from 'react'
import './App.css'
import RecipeForm from './components/RecipeForm'
import RecipeList from './components/RecipeList'

// This is your base URL for your API
const API_URL = 'http://localhost:8080'

export default function App() {
  // `recipes` is just a local snapshot — a successful request below won't show up
  // on screen until you also call setRecipes. The server and this state don't auto-sync.
  // AGAIN, the frontend UI state and the server data don't auto-sync - you must do this manually!
  // WHAT DOES THAT MEAN: Just becuase you were able to modify the state/data in the server with the fetch calls, doesn't mean the UI will reflect that automatically.
  const [recipes, setRecipes] = useState([])

  // --- React's render order, in plain terms ---
  // 1. Initial render: App runs top to bottom, `recipes` is still `[]` (the useState
  //    default), so RecipeList renders with nothing in it. The screen paints empty.
  // 2. AFTER that paint, React runs this effect (because the dependency array is `[]`,
  //    it only runs once — right after the first render, not before, and never again).
  // 3. Inside the effect, fetch is async: the request goes out, and React does not
  //    wait for it. The component is already sitting on screen while the network call
  //    is in flight.
  // 4. When the response arrives and we call `setRecipes(data)`, React schedules a
  //    state update. That triggers render # 2: App runs again, but now `recipes` holds
  //    the real array, so RecipeList renders the actual recipe cards this time.
  // Net effect: empty list -> (network round trip) -> full list. Two renders, one fetch.
  useEffect(() => {
    async function loadRecipes() {
      const response = await fetch(`${API_URL}/api/recipes`)
      const data = await response.json()
      setRecipes(data)
    }

    loadRecipes()
  }, [])

  // Part 2: send the new recipe to the server, then mirror that change into state.
  // The POST happens first and the server decides the final shape (it assigns the id),
  // so we use what the server hands back rather than newRecipe itself.
  async function handleAddRecipe(newRecipe) {
    const response = await fetch(`${API_URL}/api/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecipe),
    })
    const createdRecipe = await response.json()

    // Spread the existing recipes into a new array plus the new one.
    // We don't mutate `recipes` directly — React only re-renders when it sees a
    // new array reference, which is what triggers render #2 here.
    setRecipes([...recipes, createdRecipe])
  }

  // Part 3: tell the server to delete the row, then drop it from local state.
  // DELETE responses usually have no body, so there's nothing to parse here.
  async function handleDeleteRecipe(id) {
    await fetch(`${API_URL}/api/recipes/${id}`, {
      method: 'DELETE',
    })

    setRecipes(recipes.filter((recipe) => recipe.id !== id))
  }

  // Stretch: flip `vegetarian` on the server, then update just that one recipe locally.
  // We look up the current recipe first so we know which way to flip the boolean.
  async function handleToggleVegetarian(id) {
    const recipeToToggle = recipes.find((recipe) => {
      return recipe.id === id
    })

    const response = await fetch(`${API_URL}/api/recipes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vegetarian: !recipeToToggle.vegetarian }),
    })
    const updatedRecipe = await response.json()

    setRecipes(
      recipes.map((recipe) => (recipe.id === id ? updatedRecipe : recipe))
    )
  }

  return (
    <div id="app">
      <h1>Recipes</h1>
      <RecipeForm onAdd={handleAddRecipe} />
      <RecipeList
        recipes={recipes}
        onDelete={handleDeleteRecipe}
        onToggleVegetarian={handleToggleVegetarian}
      />
    </div>
  )
}
