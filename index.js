const pg = require ('pg');
const express = require('express');
const client = new pg.Client('postgres://localhost/the_acme_hr_directory');
const app = express();
const port = 3000;

app.use(express.json())
app.use(require('morgan')('dev'))

app.get('/api/employees', async (req,res,next)=>{
    try{
        const SQL = `
        SELECT * from employees ORDER BY created_at DESC;       
        `
        const response = await client.query(SQL);
        res.send(response.rows);
    }
    catch(err){
        next(err);
    }

});

app.get('/api/departments', async (req,res,next)=>{
    try{
        const SQL = `
        SELECT * from departments ORDER BY id DESC;       
        `
        const response = await client.query(SQL);
        res.send(response.rows);
    }
    catch(err){
        next(err);
    }

});

app.post('/api/employees', async (req,res,next)=>{

    try{
        const SQL = `
        INSERT INTO employees (name, department_id)
        VALUES ($1, $2)
        RETURNING *
        `
        const response = await client.query(SQL, [req.body.name, req.body.department_id]);
        res.send(response.rows[0]);
    }

    catch(err){
        next(err)
    }
})

app.delete('/api/employees/:id', async(req,res,next)=>{
    try{
        const SQL = `
            DELETE from employees
            WHERE id = $1
        
        `;

        const response = await client.query(SQL, [req.params.id]);
        res.sendStatus(204);

    }

    catch(err){
        next(err);
    }

});

app.put('/api/employees/:id', async(req,res,next)=>{
    try{
        const SQL = `
        UPDATE employees
        SET name = $1, department_id = $2, updated_at = now()
        WHERE id = $3 RETURNING *
        
        `;

        const response = await client.query(SQL, [req.body.name, req.body.department_id, req.params.id])
        res.send(response.rows[0]);
    }

    catch(err){
        next(err);

    }
});
const init = async () =>{
    await client.connect();
    console.log('connected to database');
    let SQL = `
    DROP TABLE IF EXISTS departments CASCADE;
    DROP TABLE IF EXISTS employees;
    

    CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
    );
    CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        department_id INTEGER REFERENCES departments(id) NOT NULL
    );
    `;
    await client.query(SQL);


    console.log("table created");

    SQL = `
        INSERT INTO departments(name) VALUES('operator');
        INSERT INTO departments(name) VALUES('inbound');
        INSERT INTO departments(name) VALUES('front_desk');
        INSERT INTO employees(name, department_id) VALUES ('Bob', (SELECT id FROM departments WHERE name = 'operator'));
        INSERT INTO employees(name, department_id) VALUES ('Steve', (SELECT id FROM departments WHERE name = 'inbound'));
        INSERT INTO employees(name, department_id) VALUES ('Mike', (SELECT id FROM departments WHERE name = 'front_desk'));
    `;
    await client.query(SQL);
    console.log("tables seeded");

    app.listen(port, () =>{
        console.log(`listening on port ${port}`)
    })

}

init();