import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Card, Button } from "react-bootstrap";
import "./pd.css";

function ProfileForm() {
  const [universites, setUniversites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSucces] = useState("");

  const API = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetch(`${API}/api/universities/`)
      .then(res => res.json())
      .then(data => setUniversites(data))
      .catch(err => console.error(err));
  }, [API]);

  const initialValues = {
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    university: "",
    location: "",
    state: "",
    country: "",
    USN: "",
    designation: "",
    email: "",
    password: "",
    phone: "",
    universitycode: "",
  };

  const validationSchema = Yup.object({
    firstName: Yup.string().required("Required"),
    lastName: Yup.string().required("Required"),
    dob: Yup.date().required("Required"),
    gender: Yup.string().required("Required"),
    USN: Yup.string().required("Required"),
    designation: Yup.string().required("Required"),
    email: Yup.string().email().required("Required"),
    password: Yup.string().min(6).required("Required"),
    phone: Yup.string().matches(/^[0-9]{10}$/).required("Required"),
    university: Yup.string().required("Required"),
    location: Yup.string().required("Required"),
    state: Yup.string().required("Required"),
    country: Yup.string().required("Required"),
    universitycode: Yup.string().required("Required"),
  });

  const onSubmit = async (values, { resetForm }) => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/api/create-profile/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (res.ok) {
        setSucces("Data updated successfully");
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
    <div className="profile-form-wrapper">

      {success && (
        <div className="alert alert-success text-center">
          {success}
        </div>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {() => (
          <Form>

            {/* PERSONAL DETAILS - FULL WIDTH */}
            <div className="row g-4">
              <div className="col-12">
                <Card>
                  <Card.Body>
                    <h5>Personal Details</h5>

                    <div className="row g-3">
                      <div className="col-md-6 col-12">
                        <label>First Name *</label>
                        <Field className="form-control" name="firstName" />
                        <ErrorMessage name="firstName" component="div" className="text-danger small" />
                      </div>

                      <div className="col-md-6 col-12">
                        <label>Last Name *</label>
                        <Field className="form-control" name="lastName" />
                        <ErrorMessage name="lastName" component="div" className="text-danger small" />
                      </div>

                      <div className="col-md-6 col-12">
                        <label>Date of Birth *</label>
                        <Field type="date" className="form-control" name="dob" />
                        <ErrorMessage name="dob" component="div" className="text-danger small" />
                      </div>

                      <div className="col-md-6 col-12">
                        <label>Gender *</label>
                        <Field as="select" className="form-select" name="gender">
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </Field>
                        <ErrorMessage name="gender" component="div" className="text-danger small" />
                      </div>
                    </div>

                  </Card.Body>
                </Card>
              </div>

              {/* ACADEMIC DETAILS */}
              <div className="col-md-6 col-12">
                <Card>
                  <Card.Body>
                    <h5>Academic Details</h5>

                    <div className="mb-3">
                      <label>USN *</label>
                      <Field className="form-control" name="USN" />
                      <ErrorMessage name="USN" component="div" className="text-danger small" />
                    </div>

                    <div className="mb-3">
                      <label>Designation *</label>
                      <Field className="form-control" name="designation" />
                      <ErrorMessage name="designation" component="div" className="text-danger small" />
                    </div>

                    <div className="mb-3">
                      <label>University Code *</label>
                      <Field className="form-control" name="universitycode" />
                      <ErrorMessage name="universitycode" component="div" className="text-danger small" />
                    </div>

                    <div className="mb-3">
                      <label>University *</label>
                      <Field as="select" className="form-select" name="university">
                        <option value="">Select University</option>
                        {universites.map((uni) => (
                          <option key={uni.id} value={uni.id}>
                            {uni.name}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="university" component="div" className="text-danger small" />
                    </div>

                    <div className="mb-3">
                      <label>Location *</label>
                      <Field className="form-control" name="location" />
                      <ErrorMessage name="location" component="div" className="text-danger small" />
                    </div>

                  </Card.Body>
                </Card>
              </div>

              {/* ACCOUNT DETAILS */}
              <div className="col-md-6 col-12">
                <Card>
                  <Card.Body>
                    <h5>Account Details</h5>

                    <div className="mb-3">
                      <label>Email *</label>
                      <Field className="form-control" name="email" />
                      <ErrorMessage name="email" component="div" className="text-danger small" />
                    </div>

                    <div className="mb-3">
                      <label>Password *</label>
                      <Field type="password" className="form-control" name="password" />
                      <ErrorMessage name="password" component="div" className="text-danger small" />
                    </div>

                    <div className="mb-3">
                      <label>Phone *</label>
                      <Field className="form-control" name="phone" />
                      <ErrorMessage name="phone" component="div" className="text-danger small" />
                    </div>

                    <div className="mb-3">
                      <label>State *</label>
                      <Field className="form-control" name="state" />
                      <ErrorMessage name="state" component="div" className="text-danger small" />
                    </div>

                    <div className="mb-3">
                      <label>Country *</label>
                      <Field className="form-control" name="country" />
                      <ErrorMessage name="country" component="div" className="text-danger small" />
                    </div>

                  </Card.Body>
                </Card>
              </div>
            </div>

            {/* SUBMIT */}
            <div className="text-center mt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </div>

          </Form>
        )}
      </Formik>
    </div>
  );
}

export default ProfileForm; 