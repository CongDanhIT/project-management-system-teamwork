const axios = require('axios');
async function testAPI() {
  try {
    const res = await axios.get('http://localhost:8000/api/project/workspace/69b407a8b54147306942b630/all?pageNumber=1&pageSize=10', {
      headers: {
        // We might get 401 Unauthorized without a token, let's see.
      }
    });
    console.log(res.data);
  } catch (e) {
    console.log('Error:', e.response ? e.response.status : e.message);
  }
}
testAPI();
