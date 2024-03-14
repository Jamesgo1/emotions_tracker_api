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

exports.getUserDetails = (req, res) => {
    const {user_id} = req.params;
    const getFields = [user_id];

    const userDetailsSQL = `
        SELECT
            u.username
          , u.password
          , ud.first_name
          , ud.last_name
          , ud.postcode
          , ud.country
          , ud.email
        FROM
            user u
                INNER JOIN user_details ud
                           ON u.user_id = ud.user_id
        WHERE
            u.user_id = ?
    `

    conn.query(userDetailsSQL, getFields, (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {
            console.log(rows);
            res.status(200)
            res.json({
                status: "success",
                message: `User details retrieved`,
                details: rows
            });
        }

    });
}
;

exports.getLoginAttempts = (req, res) => {
    const {user_id} = req.params;
    const getFields = [user_id];

    // Change this number for customised failure threshold
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
    conn.query(failedLoginAttemptsSQL, getFields, (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {

            const {total} = rows.at(0);
            if (total > failureThreshold) {
                res.status(429)
                res.json({
                    status: "failure",
                    message: "Too many unsuccessful login attempts."
                });
            } else {
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
    const {username} = req.body;
    const fieldsToCheck = [username];
    console.log(username);

    checkSQLQuery = `
        SELECT
            COUNT(*) dupe_count
        FROM
            user_details ud
                INNER JOIN user u
                           ON ud.user_id = u.user_id
        WHERE
             u.username = ?
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
                    message: `Username already in use. Please use different credentials`
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

exports.updateUserValue = (req, res) => {
    console.log(req.body);
    const {new_val, field_to_update, user_id} = req.body;
    console.log(req.body);
    const fieldsToUpdate = [new_val, user_id];

    updateSQLQuery = `
        UPDATE user u
            INNER JOIN user_details ud
            ON u.user_id = ud.user_id
        SET
            ${field_to_update} = ?
        WHERE
            u.user_id = ?
    `
    console.log("Fields to update")
    console.log(fieldsToUpdate);
    conn.query(updateSQLQuery, fieldsToUpdate, (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {
            res.status(200);
            res.json({
                status: 'success',
                message: `User credentials successfully updated`,
            });
        }

    })
}


exports.deleteUser = (req, res) => {
    const {user_id} = req.params;
    const idToDelete = [user_id];
    console.log(idToDelete);

    deleteSQLQuery = `
        START TRANSACTION
;

SET @var_user_del_id = ?;

DROP TABLE IF EXISTS emotion_score_deletes;

DROP TABLE IF EXISTS score_sub_deletes;

DROP TABLE IF EXISTS trigger_details_deletes;

DROP TABLE IF EXISTS trigger_sub_deletes;


CREATE TEMPORARY TABLE emotion_score_deletes
SELECT esc.emotion_score_id FROM emotion_score esc
INNER JOIN score_sub_link sl
ON esc.emotion_score_id = sl.emotion_score_id
INNER JOIN emotion_submission es
ON es.emotion_submission_id = sl.emotion_submission_id
WHERE es.user_id = @var_user_del_id
;

CREATE TEMPORARY TABLE score_sub_deletes
SELECT sl.score_sub_id FROM score_sub_link sl
INNER JOIN emotion_submission es
ON es.emotion_submission_id = sl.emotion_submission_id
WHERE es.user_id = @var_user_del_id
;

CREATE TEMPORARY TABLE trigger_details_deletes
SELECT td.trigger_id FROM trigger_details td
INNER JOIN trigger_sub_link tsl
ON td.trigger_id = tsl.trigger_id
INNER JOIN emotion_submission es
ON es.emotion_submission_id = tsl.emotion_submission_id
WHERE es.user_id = @var_user_del_id
;

CREATE TEMPORARY TABLE trigger_sub_deletes
SELECT tsl.trigger_sub_id FROM trigger_sub_link tsl
INNER JOIN emotion_submission es
ON es.emotion_submission_id = tsl.emotion_submission_id
WHERE es.user_id = @var_user_del_id
;

DELETE FROM user_details ud
WHERE ud.user_id = @var_user_del_id
;

DELETE FROM user_login_hist ulh
WHERE ulh.user_id = @var_user_del_id
;


DELETE FROM score_sub_link sl
WHERE sl.score_sub_id IN (SELECT * FROM emotion_score_deletes)
;

DELETE FROM trigger_sub_link tsl
WHERE tsl.trigger_sub_id IN (SELECT * FROM trigger_sub_deletes)
;

DELETE FROM emotion_submission es
WHERE es.user_id = @var_user_del_id
;

DELETE FROM trigger_details td
WHERE td.trigger_id IN (SELECT * FROM trigger_details_deletes)
;

DELETE FROM emotion_score es
WHERE es.emotion_score_id IN (SELECT * FROM emotion_score_deletes)
;

DELETE FROM user u
WHERE u.user_id = @var_user_del_id
;

COMMIT;
    `
    conn.query(deleteSQLQuery, idToDelete, (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {
            res.status(200);
            res.json({
                status: 'success',
                message: `User credentials successfully deleted`,
            });
        }

    })
}