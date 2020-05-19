const express = require('express');
const app = express();
app.use(express.static('./crossOriginTest'));

app.listen(3000);
app.listen(4000);
