import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Card, Button } from "react-bootstrap";
import "./pd.css";

function Unireg() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const API = process.env.REACT_APP_API_URL;

  const initialValues = {
    universityname: "",
    universitytype: "",
    universityestablishment: "",
    fulladdress: "",
    website: "",
    uhoi: "",
    principle: "",
    collegecode: "",
    affiliationdetails: "",
    accredationstatus: "",
    requireddocs: "",
    state: "",
    country: "",
    email: "",
    contact: "",  
    about: "",
  };

  const validationSchema = Yup.object({
    universityname:          Yup.string().required("Please add your university name"),
    universitytype:          Yup.string().required("Please fill this field"),
    universityestablishment: Yup.date().required("Establishment year is required"),
    fulladdress:             Yup.string().required("Complete address is required"),
    website:                 Yup.string().required("Website link is required"),
    uhoi:                    Yup.string().required("Head of Institution is required"),
    principle:               Yup.string().required("Principal name is required"),
    collegecode:             Yup.string().min(6, "Min 6 characters").required("College code is required"),
    affiliationdetails:      Yup.string().required("Affiliation details are required"),
    accredationstatus:       Yup.string().required("Accreditation status is required"),
    requireddocs:            Yup.string().required("Required documents field cannot be empty"),
    state:                   Yup.string().required("State is required"),
    country:                 Yup.string().required("Country is required"),
    email:                   Yup.string().email("Invalid email").required("Email is required"),
    contact:                 Yup.string().required("Contact number is required"),
    about:                   Yup.string(),
  });

  const onSubmit = async (values, { resetForm }) => {
    try {
      setLoading(true);

      
      const res = await fetch(`${API}/api/create-university/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("University registered successfully!");
        resetForm();
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-form-wrapper" style={{ width: "100%", padding: "1rem" }}>
      {success && (
        <div className="alert alert-success text-center">{success}</div>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {() => (
          <Form>
            <div className="row">

              
              <div className="col-12 mb-2">
                <Card>
                  <Card.Body>
                    <h5>UNIVERSITY DETAILS</h5>
                    <div className="row">
                      <div className="col-6">
                        <div className="mb-3">
                          <label className="form-label">University Name <span className="text-danger">*</span></label>
                          <Field className="form-control" name="universityname" placeholder="University Name" />
                          <ErrorMessage name="universityname" component="span" className="text-danger small" />
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="mb-3">
                          <label className="form-label">University Type <span className="text-danger">*</span></label>
                          <Field className="form-control" name="universitytype" placeholder="e.g. Public / Private" />
                          <ErrorMessage name="universitytype" component="span" className="text-danger small" />
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="mb-3">
                          <label className="form-label">Establishment Date <span className="text-danger">*</span></label>
                          <Field type="date" className="form-control" name="universityestablishment" />
                          <ErrorMessage name="universityestablishment" component="span" className="text-danger small" />
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="mb-3">
                          <label className="form-label">Full Address <span className="text-danger">*</span></label>
                          <Field className="form-control" name="fulladdress" placeholder="Full Address" />
                          <ErrorMessage name="fulladdress" component="span" className="text-danger small" />
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>

              
              <div className="col-6 mb-3">
                <Card className="h-100">
                  <Card.Body>
                    <h5>ABOUT UNIVERSITY</h5>
                    <div className="mb-3">
                      <label className="form-label">Head of Institution <span className="text-danger">*</span></label>
                      <Field className="form-control" name="uhoi" placeholder="Head of Institution" />
                      <ErrorMessage name="uhoi" component="span" className="text-danger small" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Principal <span className="text-danger">*</span></label>
                      <Field className="form-control" name="principle" placeholder="Principal Name" />
                      <ErrorMessage name="principle" component="span" className="text-danger small" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">College Code <span className="text-danger">*</span></label>
                      <Field className="form-control" name="collegecode" placeholder="College Code" />
                      <ErrorMessage name="collegecode" component="span" className="text-danger small" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Affiliation Details <span className="text-danger">*</span></label>
                      <Field className="form-control" name="affiliationdetails" placeholder="Affiliated to..." />
                      <ErrorMessage name="affiliationdetails" component="span" className="text-danger small" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Accreditation Status <span className="text-danger">*</span></label>
                      <Field className="form-control" name="accredationstatus" placeholder="e.g. NAAC A+" />
                      <ErrorMessage name="accredationstatus" component="span" className="text-danger small" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Required Docs <span className="text-danger">*</span></label>
                      <Field className="form-control" name="requireddocs" placeholder="Scanned document links / info" />
                      <ErrorMessage name="requireddocs" component="span" className="text-danger small" />
                    </div>
                  </Card.Body>
                </Card>
              </div>

              
              <div className="col-6 mb-3">
                <Card className="h-100">
                  <Card.Body>
                    <h5>BASIC DETAILS</h5>
                    <div className="mb-3">
                      <label className="form-label">Website <span className="text-danger">*</span></label>
                      <Field className="form-control" name="website" placeholder="https://youruni.edu" />
                      <ErrorMessage name="website" component="span" className="text-danger small" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Country <span className="text-danger">*</span></label>
                      <Field className="form-control" name="country" placeholder="Country" />
                      <ErrorMessage name="country" component="span" className="text-danger small" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">State <span className="text-danger">*</span></label>
                      <Field className="form-control" name="state" placeholder="State" />
                      <ErrorMessage name="state" component="span" className="text-danger small" />
                    </div>

                    
                    <div className="mb-3">
                      <label className="form-label">Contact <span className="text-danger">*</span></label>
                      <Field className="form-control" name="contact" placeholder="Contact Number" />
                      <ErrorMessage name="contact" component="span" className="text-danger small" />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Email <span className="text-danger">*</span></label>
                      <Field className="form-control" name="email" placeholder="Email" />
                      <ErrorMessage name="email" component="span" className="text-danger small" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">About (optional)</label>
                      <Field as="textarea" className="form-control" name="about" placeholder="Short description..." />
                    </div>
                  </Card.Body>
                </Card>
              </div>

            </div>

            <div className="row">
              <div className="col-12 text-center pb-4">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Submitting..." : "Register University"}
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default Unireg;