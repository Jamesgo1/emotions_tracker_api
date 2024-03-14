const conn = require('../utils/dbconn');


exports.getEmotions = async (req, res) => {
    const selectSQL = 'SELECT ed.emotion_name FROM emotion_details ed';
    conn.query(selectSQL, (err, rows) => {
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
                message: `${rows.length} records retrieved`,
                result: rows
            });
        }
    });
};


exports.getSingleEmotion = async (req, res) => {
    const emotion_name = req.params.emotion;
    const selectSQL = 'SELECT * FROM emotion_details ed WHERE ed.emotion_name = ? ';
    emotion_name_array = [emotion_name]
    conn.query(selectSQL, emotion_name_array, (err, rows) => {
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
                message: `${rows.length} records retrieved`,
                result: rows
            });
        }
    });
};

exports.getCheckIfAlreadySubmitted = async (req, res) => {
    const user_id = req.params.user_id;

    const selectSQL = `
        SELECT
            COUNT(*) total
        FROM
            emotion_submission es
        WHERE
              es.user_id = ?
          AND DATE(SYSDATE()) = DATE(es.submission_datetime)
    `
    conn.query(selectSQL, [user_id], (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {
            const total = rows.at(0).total;
            console.log(total);
            res.status(200);
            res.json({
                status: 'success',
                message: `${rows.length} records retrieved`,
                result: total
            });

        }
    });
}
exports.postNewEmotions = async (req, res) => {
    const {
        user_id, anger_score, contempt_score, disgust_score, enjoyment_score, fear_score, sadness_score, surprise_score,
        triggers_array
    } = req.body;
    const emotionScoresArray = [
        user_id,
        anger_score,
        contempt_score,
        disgust_score,
        enjoyment_score,
        fear_score,
        sadness_score,
        surprise_score]

    emotionScoresArray.push(...triggers_array);

    var triggerSQL = "";
    triggers_array.forEach((triggerInput) => {
        triggerSQL = triggerSQL.concat(
            `INSERT INTO
                 trigger_details
             VALUES
                 (DEFAULT, ?, NULL)
            ;
            INSERT INTO
                trigger_sub_link
            VALUES
                (DEFAULT, LAST_INSERT_ID(), @var_submission_id)
            ;
            `
        );
    });

    const insertScoresSQL = `
    START TRANSACTION ;

INSERT INTO emotion_submission VALUES(DEFAULT, DEFAULT, ?);
SET @var_submission_id = LAST_INSERT_ID();

INSERT INTO emotion_score VALUES(DEFAULT, ?, 1);
INSERT INTO score_sub_link VALUES(DEFAULT, LAST_INSERT_ID(), @var_submission_id);

INSERT INTO emotion_score VALUES(DEFAULT, ?, 2);
INSERT INTO score_sub_link VALUES(DEFAULT, LAST_INSERT_ID(), @var_submission_id);

INSERT INTO emotion_score VALUES(DEFAULT, ?, 3);
INSERT INTO score_sub_link VALUES(DEFAULT, LAST_INSERT_ID(), @var_submission_id);

INSERT INTO emotion_score VALUES(DEFAULT, ?, 4);
INSERT INTO score_sub_link VALUES(DEFAULT, LAST_INSERT_ID(), @var_submission_id);

INSERT INTO emotion_score VALUES(DEFAULT, ?, 5);
INSERT INTO score_sub_link VALUES(DEFAULT, LAST_INSERT_ID(), @var_submission_id);

INSERT INTO emotion_score VALUES(DEFAULT, ?, 6);
INSERT INTO score_sub_link VALUES(DEFAULT, LAST_INSERT_ID(), @var_submission_id);

INSERT INTO emotion_score VALUES(DEFAULT, ?, 7);
INSERT INTO score_sub_link VALUES(DEFAULT, LAST_INSERT_ID(), @var_submission_id);
    `
    const finalSQL = insertScoresSQL.concat(triggerSQL, "\n", "COMMIT;");

    console.log(finalSQL);

    conn.query(finalSQL, emotionScoresArray, (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {
            res.status(201);
            res.json({
                status: "success",
                message: "Successfully submitted emotion scores"
            });

        }
    })

};

exports.getTotalEmotionsSubmitted = async (req, res) => {
    const user_id = req.params.user_id;
    console.log(user_id);
    const selectSQL = 'SELECT COUNT(*) total FROM emotion_submission es WHERE es.user_id = ? ';

    conn.query(selectSQL, [user_id], (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {
            console.log(rows.length);
            console.log(rows);
            if (rows.length < 1) {
                res.status(404);
                res.json({
                    status: "failure",
                    message: "No submissions found for that user id"
                })
            } else {
                res.status(200);
                res.json({
                    status: 'success',
                    message: `${rows.length} records retrieved`,
                    result: rows
                });
            }
        }
    });
};

exports.getEmotionSubmissions = async (req, res) => {
    const user_id = req.params.user_id;
    console.log(user_id);
    const selectSQL = `
        DROP TABLE IF EXISTS emotion_subs1
        ;

        CREATE TEMPORARY TABLE emotion_subs1
        SELECT
            es.emotion_submission_id
          , ed.emotion_name
          , esc.emotion_score
          , GROUP_CONCAT(td.trigger_desc ORDER BY td.trigger_id)
                triggers
          , es.submission_datetime
        FROM
            emotion_submission es
                INNER JOIN score_sub_link sl
                           ON es.emotion_submission_id = sl.emotion_submission_id
                LEFT JOIN trigger_sub_link tsl
                          ON es.emotion_submission_id = tsl.emotion_submission_id
                INNER JOIN emotion_score esc
                           ON sl.emotion_score_id = esc.emotion_score_id
                LEFT JOIN trigger_details td
                          ON td.trigger_id = tsl.trigger_id
                INNER JOIN emotion_details ed
                           ON esc.emotion_details_id = ed.emotion_details_id
        WHERE
            es.user_id = ?
        GROUP BY
            ed.emotion_name
          , esc.emotion_score
          , esc.emotion_score_id
          , es.submission_datetime
          , es.emotion_submission_id
        ORDER BY
            es.emotion_submission_id
          , esc.emotion_score_id
        ;

        SELECT
            ems1.emotion_submission_id
          , JSON_OBJECTAGG(ems1.emotion_name, ems1.emotion_score) emotion_scores
          , ems1.triggers
          , ems1.submission_datetime
        FROM
            emotion_subs1 ems1
        GROUP BY
            ems1.emotion_submission_id
          , ems1.triggers
        ;`;


    conn.query(selectSQL, [user_id], (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {
            res.status(200);
            console.log(rows);
            res.json({
                status: 'success',
                message: `${rows.length} records retrieved`,
                result: rows
            });
        }
    });
};

exports.deleteSubmission = async (req, res) => {
    console.log(req.params);
    const {sub_id} = req.params;
    const vals = [sub_id];
    console.log("Submission to delete:")
    console.log(vals);
    const deleteSQL = `
START TRANSACTION
;

SET @var_sub_id = ?;

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
WHERE es.emotion_submission_id = @var_sub_id
;

CREATE TEMPORARY TABLE score_sub_deletes
SELECT sl.score_sub_id FROM score_sub_link sl
INNER JOIN emotion_submission es
ON es.emotion_submission_id = sl.emotion_submission_id
WHERE es.emotion_submission_id = @var_sub_id
;

CREATE TEMPORARY TABLE trigger_details_deletes
SELECT td.trigger_id FROM trigger_details td
INNER JOIN trigger_sub_link tsl
ON td.trigger_id = tsl.trigger_id
INNER JOIN emotion_submission es
ON es.emotion_submission_id = tsl.emotion_submission_id
WHERE es.emotion_submission_id = @var_sub_id
;

CREATE TEMPORARY TABLE trigger_sub_deletes
SELECT tsl.trigger_sub_id FROM trigger_sub_link tsl
INNER JOIN emotion_submission es
ON es.emotion_submission_id = tsl.emotion_submission_id
WHERE es.emotion_submission_id = @var_sub_id
;

DELETE FROM score_sub_link sl
WHERE sl.score_sub_id IN (SELECT * FROM emotion_score_deletes)
;

DELETE FROM trigger_sub_link tsl
WHERE tsl.trigger_sub_id IN (SELECT * FROM trigger_sub_deletes)
;

DELETE FROM emotion_submission es
WHERE es.emotion_submission_id = @var_sub_id
;

DELETE FROM trigger_details td
WHERE td.trigger_id IN (SELECT * FROM trigger_details_deletes)
;

DELETE FROM emotion_score es
WHERE es.emotion_score_id IN (SELECT * FROM emotion_score_deletes)
;

COMMIT;
    `
    conn.query(deleteSQL, vals, (err, rows) => {
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
                message: "Submission successfully deleted"
            });

        }
    });
};

exports.getCurrentSubTriggers = async (req, res) => {
    const {sub_id} = req.params;
    const vals = [sub_id];

    const selectSQL = `
        SELECT
            td.trigger_id
          , td.trigger_desc
        FROM
            trigger_details td
                INNER JOIN trigger_sub_link tsl
                           ON td.trigger_id = tsl.trigger_id
        WHERE
            tsl.emotion_submission_id = ?
    `

    conn.query(selectSQL, vals, (err, rows) => {
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
                message: `${rows.length} rows returned`,
                result: rows

            });

        }
    });
};

exports.getTriggerCount = async (req, res) => {
    const {user_id} = req.params;
    const vals = [user_id];
    console.log(vals);

    const selectSQL = `
        SELECT
            trigger_desc
          , COUNT(td.trigger_id) total
        FROM
            trigger_details td
                INNER JOIN trigger_sub_link tsl
                           ON td.trigger_id = tsl.trigger_id
                INNER JOIN emotion_submission es
                           ON tsl.emotion_submission_id = es.emotion_submission_id
        WHERE
            es.user_id = ?
        GROUP BY
            trigger_desc
        ORDER BY
            total DESC
    `

    conn.query(selectSQL, vals, (err, rows) => {
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
                message: `${rows.length} rows returned`,
                result: rows

            });

        }
    });
};

exports.deleteTriggers = async (req, res) => {
    const triggersToDelete = req.body;
    console.log(triggersToDelete);
    const wildCardArray = [];
    triggersToDelete.forEach((triggerID) => {
        wildCardArray.push("?")
    });

    const wildCardString = wildCardArray.join(", ");

    const deleteSQL = `
        DROP TABLE IF EXISTS emotion_score_deletes
        ;

        CREATE TEMPORARY TABLE trigger_deletes
        SELECT
            td.trigger_id
        FROM
            trigger_details td
        WHERE
            td.trigger_id IN (${wildCardString})
        ;


        DELETE
        FROM
            trigger_sub_link tsl
        WHERE
            tsl.trigger_id IN (
                                  SELECT
                                      *
                                  FROM
                                      trigger_deletes
                                  )
        ;

        DELETE
        FROM
            trigger_details td
        WHERE
            td.trigger_id IN (
                                 SELECT
                                     *
                                 FROM
                                     trigger_deletes
                                 )
        ;`

    conn.query(deleteSQL, triggersToDelete, (err, rows) => {
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
                message: `Triggers successfully deleted`,

            });

        }
    });
};


exports.addNewTriggers = async (req, res) => {
    const triggersArray = req.body;
    const sub_id = triggersArray.pop();

    console.log(triggersArray);
    console.log(sub_id)
    triggerSQL = "";

    triggersArray.forEach((triggerInput) => {
        triggerSQL = triggerSQL.concat(
            `INSERT INTO
                 trigger_details
             VALUES
                 (DEFAULT, ?, NULL)
            ;
            INSERT INTO
                trigger_sub_link
            VALUES
                (DEFAULT, LAST_INSERT_ID(), ${sub_id})
            ;
            `
        );
    });

    console.log(triggerSQL);

    conn.query(triggerSQL, triggersArray, (err, rows) => {
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
                message: `Triggers successfully added`,

            });

        }
    });
};
