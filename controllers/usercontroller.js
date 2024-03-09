const conn = require('./../utils/dbconn');

exports.postGetUserDetails = (req, res) => {
    // Getting the username and password associated with it to decrypt and compare
    console.log("Entering post get user details:")
    console.log(req.body);
    const {username} = req.body;
    const vals = [username];
    getLoginDataSQL = `
        SELECT
            u.user_id
          , u.password
        FROM
            user u
        WHERE
            u.username = ?
        ;
    `
    conn.query(getLoginDataSQL, vals, (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {
            console.log(rows);
            if (rows.length === 1) {
                const output_data = rows.at(0);
                const {user_id, password} = output_data;
                console.log(user_id);
                console.log(password);
                res.status(200);
                res.json({
                    status: 'success',
                    data: {output_data}
                });
            } else {
                console.log("I'm here")
                res.status(404);
                res.json({
                    status: 'failure',
                    data: {}
                })
            }

        }
    })
}

exports.getLoginAttempts = (req, res) => {
    const {user_id} = req.params;
    const insertFields = [user_id];

    // Change this number for failure threshold
    const failureThreshold = 5;

    const failedLoginAttemptsSQL = `
        SELECT
            COUNT(*) total
        FROM
            user_login_hist ulh
        WHERE
              ulh.user_id = ?
          AND DATE(ulh.login_date_time) = DATE(SYSDATE())
          AND ulh.success_ind < 1
    `
    conn.query(failedLoginAttemptsSQL, insertFields, (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {

            const {total} = rows.at(0);
            if(total > failureThreshold){
                res.status(429)
                res.json({
                    status: "failure",
                    message: "Too many unsuccessful login attempts."
                });
            }
            else{
                res.status(200)
                res.json({
                    status: "success",
                    message: `${total} failed login attempts today, login allowed`
                });
            }

        }
    })
}
exports.postLoginHist = (req, res) => {
    const {success_ind, user_id} = req.body;
    insertFields = [success_ind, user_id];
    const loginHistSQL = `
        INSERT INTO
            user_login_hist
        VALUES
            (DEFAULT, ?, ?, DEFAULT)
    `
    conn.query(loginHistSQL, insertFields, (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {
            res.status(201);
            res.json({
                status: 'success',
                message: `Login attempt added to history table`,
            });
        }
    });
}

exports.postLogin = (req, res) => {
    console.log("login details:")
    console.log(req.body);
    const {username, encryptedPassword} = req.body;
    const vals = [username, encryptedPassword];
    transact_sql = `    START TRANSACTION;



SELECT COUNT(*)
INTO @users_found_count
FROM user u
WHERE u.user_id = @var_current_user_id
AND u.password = ?
;


SELECT
CASE WHEN @users_found_count >= 1 THEN 1 ELSE 0 END
INTO @var_login_success;



SELECT * FROM user_login_hist ulh WHERE ulh.user_login_hist_id = LAST_INSERT_ID();

COMMIT;`
    conn.query(transact_sql, vals, (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {
            console.log("here");
            const output_data = rows.at(-2).at(0);
            console.log("Output data:");
            console.log(output_data);
            const failure_count_data = rows.at(-3).at(0);
            console.log("Failure count data");
            console.log(failure_count_data);
            const failure_threshold = 3;
            const failure_count = failure_count_data["total"];
            const {user_login_hist_id, success_ind, user_id, login_date_time} = output_data
            console.log(`Number of failures: ${failure_count}`)
            console.log(user_id);


            if (success_ind === 1) {
                res.status(200);
                res.json({
                    status: 'success',
                    message: `User ${user_id} successfully logged in at ${login_date_time}`,
                    user_id: user_id
                });
            } else if (failure_count > failure_threshold) {
                res.status(429);
                res.json({
                    status: 'failure',
                    message: `Too many unsuccessful login attempts`,
                });
            } else {
                res.status(401);
                res.json({
                    status: 'failure',
                    message: `Invalid user credentials`
                });
            }

        }
    })
};

exports.postLoginOutcome = (req, res) => {

}

exports.postRegister = (req, res) => {
    console.log(req.body);
    const {
        username,
        encryptedPassword,
        encryptedFirstName,
        encryptedLastName,
        postcode,
        country,
        encryptedEmail
    } = req.body;
    const insertFields = [
        username, encryptedPassword, encryptedFirstName, encryptedLastName, postcode, country, encryptedEmail
    ];
    const insertUserDetailsSQL = `
    START TRANSACTION;

INSERT INTO user VALUES(DEFAULT, ?, ?);

SET @last_user_id = LAST_INSERT_ID();

INSERT INTO user_details VALUES(DEFAULT, ?, ?, ?, ?, ?, DEFAULT, NULL,
                                @last_user_id);

SELECT @last_user_id;

COMMIT;
    `
    conn.query(insertUserDetailsSQL, insertFields, (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {
            if (rows.length === 6) {
                const row = rows.at(4);
                const user_id_output = rows.at(4).at(0)["@last_user_id"];
                res.status(200);
                res.json({
                    status: 'success',
                    message: `New user successfully registered`,
                    user_id: user_id_output
                });
            } else {
                res.status(401);
                res.json({
                    status: 'failure',
                    message: `Problem with credentials input in form`,
                });
            }

        }
    })


};

exports.postCheckUniqueRegField = (req, res) => {
    console.log(req.body);
    const {username, email} = req.body;
    const fieldsToCheck = [username, email];
    console.log(username);
    console.log(email);

    checkSQLQuery = `
        SELECT
            COUNT(*) dupe_count
        FROM
            user_details ud
                INNER JOIN user u
                           ON ud.user_id = u.user_id
        WHERE
             u.username = ?
          OR ud.email = ?
                     AND ud.end_datetime IS NULL
        ;

    `
    console.log("Fields to check")
    console.log(fieldsToCheck);
    conn.query(checkSQLQuery, fieldsToCheck, (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {
            console.log(rows);
            const {dupe_count} = rows.at(0);
            if (dupe_count > 0) {
                res.status(403);
                res.json({
                    status: 'failure',
                    message: `Username or email already in use. Please use different credentials`
                });
            } else {
                res.status(200);
                res.json({
                    status: 'success',
                    message: `User credentials are free to be registered`,
                });
            }

        }
    })
};