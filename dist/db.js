import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();
const pool = mysql
    .createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
})
    .promise();
export function datetime() {
    let date = new Date();
    const dateSQL = date.toISOString().split("T")[0] + " " + date.toTimeString().split(" ")[0];
    return dateSQL;
}
export async function createTableUsers() {
    try {
        await pool.query("CREATE TABLE IF NOT EXISTS " +
            process.env.MYSQL_TABLE_NAME_USERS +
            " ( teleg_id INTEGER PRIMARY KEY NOT NULL, address VARCHAR(35) NOT NULL, share FLOAT NOT NULL)");
    }
    catch (error) {
        console.log("ERROR IN CREATETABLEUSERS " + error);
    }
}
export async function createTableLogs() {
    try {
        await pool.query("CREATE TABLE IF NOT EXISTS " +
            process.env.MYSQL_TABLE_NAME_LOGS +
            " (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, datetime VARCHAR(25) NOT NULL, value FLOAT NOT NULL, FOREIGN KEY (user_id) REFERENCES " +
            process.env.MYSQL_TABLE_NAME_USERS +
            "(teleg_id))");
    }
    catch (error) {
        console.log("ERROR IN CREATETABLELOGS " + error);
    }
}
export async function getUser(id) {
    try {
        const [result] = await pool.query("SELECT * FROM " +
            process.env.MYSQL_TABLE_NAME_USERS +
            " WHERE teleg_id = ?", [id]);
        return JSON.parse(JSON.stringify(result));
    }
    catch (error) {
        console.log("ERROR IN GETuser " + error);
    }
}
export async function getLogs(user_id) {
    try {
        const [result] = await pool.query("SELECT * FROM " +
            process.env.MYSQL_TABLE_NAME_LOGS +
            " WHERE user_id = ?", [user_id]);
        return [JSON.parse(JSON.stringify(result))];
    }
    catch (error) {
        console.log("ERROR IN GETLOGS " + error);
    }
}
export async function createLog(user_id, datetime, value) {
    try {
        const result = await pool.query("INSERT INTO " +
            process.env.MYSQL_TABLE_NAME_LOGS +
            "(user_id, datetime, value) VALUES (?, ?, ?)", [user_id, datetime, value]);
        var [bydate] = await pool.query("SELECT id FROM " +
            process.env.MYSQL_TABLE_NAME_LOGS +
            " WHERE user_id = ? ORDER BY id DESC LIMIT 10 OFFSET " +
            process.env.MYSQL_LOGS_SAVE_NUM, [user_id]);
        const bydateRes = JSON.parse(JSON.stringify(bydate));
        if (bydateRes.length === 0) {
            return [JSON.parse(JSON.stringify(result)), bydateRes];
        }
        var stringRequest = "DELETE FROM " + process.env.MYSQL_TABLE_NAME_LOGS + " WHERE";
        for (let i = 0; i < bydateRes.length; i++) {
            if (i !== 0) {
                stringRequest += " OR";
            }
            stringRequest += " id = " + String(bydateRes[i].id);
        }
        await pool.query(stringRequest);
        return JSON.parse(JSON.stringify(result));
    }
    catch (error) {
        console.log("ERROR IN CREATELOG " + error);
    }
}
export async function createUser(teleg_id, address, share) {
    try {
        const result = await pool.query("INSERT INTO " +
            process.env.MYSQL_TABLE_NAME_USERS +
            "(teleg_id, address, share) VALUES (?, ?, ?)", [teleg_id, address, share]);
        return JSON.parse(JSON.stringify(result));
    }
    catch (error) {
        console.log("ERROR IN CREATEUSERS " + error);
    }
}
export async function updateUsers(teleg_id, toUpdate, newValue) {
    try {
        await pool.query("UPDATE " +
            process.env.MYSQL_TABLE_NAME_USERS +
            " SET " +
            toUpdate +
            " = ? WHERE id = ?", [newValue, teleg_id]);
    }
    catch (error) {
        console.log("ERROR IN UPDATEUSERS " + error);
    }
}
createTableUsers();
createTableLogs();
//await createUser(123, "hhh", 0.15);
for (let i = 0; i < 3; i++) {
    var time = datetime();
    await createLog(123, time, i + 0.15);
    console.log(await getLogs(123));
}
for (let i = 0; i < 3; i++) {
    var time = datetime();
    await createLog(123, time, i + 0.15);
    console.log(await getLogs(123));
}
