import { Container, Form } from './style'
import ButtonExample from '../../components/button'
//import api from '../../services/api.tsx' para puchar dados do backend

function Home() 
{
  return (
    <Container>
      <Form>
        <h1>HOME</h1>
        <h1>PAGE PLACEHOLDER</h1>
        <ButtonExample />
      </Form>
    </Container>
  )
}

export default Home
