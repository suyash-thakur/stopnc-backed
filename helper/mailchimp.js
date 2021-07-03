const Mailchimp = require("mailchimp-api-v3");
var md5 = require("md5");

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;

let mailchimp;

if (MAILCHIMP_API_KEY) {
  mailchimp = new Mailchimp(MAILCHIMP_API_KEY);
}

const isEmptyMailchimp =
  typeof mailchimp === Object &&
  mailchimp.keys(mailchimp).length === 0 &&
  mailchimp.constructor === Object;

const addSubscriber = (email, data, update) => {
  // Make sure mailchimp, email and listid are all set and not undefined
  if (!mailchimp || !email || isEmptyMailchimp || !MAILCHIMP_LIST_ID) {
    const msg = `Ignoring adding subscriber, missing params ${
      !email ? "email" : "API Key or List ID"
    }`;
    console.warn(msg);
    return Promise.reject({ msg });
  }

  return mailchimp
    .post(`lists/${MAILCHIMP_LIST_ID}`, {
      update_existing: update !== undefined ? update : true,
      members: [
        {
          email_address: email.toLowerCase(),
          status: data.status || "subscribed",
          merge_fields: {},
        },
      ],
    })
    .then((m) => {
      if (m && Object.keys(m.errors).length > 0) {
        console.log("Error adding new subscriber to MC", m.errors);
        return Promise.reject({ m });
      }
      console.log("Added");
      addTag(email);
      return Promise.resolve({ m });
    })
    .catch((err) => {
      console.warn("Failed adding subscriber", email, err);
      return Promise.reject({ err });
    });
};

const addTag = (email) => {
  let emailHash = md5(email.toLowerCase());
  return mailchimp
    .post(`lists/${MAILCHIMP_LIST_ID}/members/${emailHash}/tags`, {
      // TODO make sure to change this part right here
      tags: [{ name: "signed up", status: "active" }],
    })
    .then((m) => {
      if (m && m.errors && Object.keys(m.errors).length > 0) {
        console.log("Error adding tag to subscriber ", m.errors);
      }
      return m;
    })
    .catch((err) => {
      console.warn("Failed to tag subscriber", email, err);
    });
};
module.exports = {
  addSubscriber,
};
