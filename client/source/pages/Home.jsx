import { useEffect } from "react";

function Home() {
   useEffect(() => {
      fetch("/api")
         .then((res) => res.json())
         .then((data) => console.log(data));
   }, []);
   return (
      <h1>Hello, World!</h1>
   );
}

export default Home;
