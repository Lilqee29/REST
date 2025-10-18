import React, { useState, useContext, useEffect } from "react";
import "./Add.css";
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const Add = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);

  const [image, setImage] = useState(null);
const [data, setData] = useState({
  name: "",
  description: "",
  price: "",
  category: "Salad",
  type: "normal",
  popular: false,          // still keeps a badge
  ingredients: "",
  allergens: "",
  tags: "",                // we can remove free-text usage
  selectedTag: "",         // for dropdown
});


  const onChangeHandler = (event) => {
    const { name, value, type, checked } = event.target;
    if (type === "checkbox") {
      setData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
        formData.append(
      "price",
      Number(data.price.replace(",", ".")).toFixed(2)
    );

    formData.append("category", data.category);
    formData.append("type", data.type);
    formData.append("popular", data.popular);
    formData.append("ingredients", data.ingredients.split(",").map((i) => i.trim()));
    formData.append("allergens", data.allergens.split(",").map((a) => a.trim()));
    formData.append(
  "tags",
  data.selectedTag ? [data.selectedTag] : [] // send as an array for backend
);


    formData.append("image", image);

    try {
      const response = await axios.post(`${url}/api/food/add`, formData, { headers: { token } });
      if (response.data.success) {
        toast.success(response.data.message);
        setData({
          name: "",
          description: "",
          price: "",
          category: "Salad",
          type: "normal",
          popular: false,
          ingredients: "",
          allergens: "",
          tags: "",
        });
        setImage(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      toast.error("Error adding food");
      console.error(err);
    }
  };

  useEffect(() => {
    if (!admin || !token) {
      toast.error("Please login first");
      navigate("/");
    }
  }, []);

  return (
    <div className="add">
      <form onSubmit={onSubmitHandler} className="flex-col">
        {/* Image Upload */}
        <div className="add-img-upload flex-col">
          <p>Upload image</p>
          <label htmlFor="image">
            <img src={image ? URL.createObjectURL(image) : assets.upload_area} alt="" />
          </label>
          <input
            onChange={(e) => setImage(e.target.files[0])}
            type="file"
            id="image"
            hidden
            required
          />
        </div>

        {/* Name & Description */}
        <div className="add-product-name flex-col">
          <p>Product name</p>
          <input
            type="text"
            name="name"
            value={data.name}
            onChange={onChangeHandler}
            placeholder="Type here"
            required
          />
        </div>

        <div className="add-product-description flex-col">
          <p>Product description</p>
          <textarea
            name="description"
            value={data.description}
            onChange={onChangeHandler}
            rows="6"
            placeholder="Write content here"
            required
          ></textarea>
        </div>

        {/* Category, Type, Popular, Price */}
        <div className="add-category-price">
          <div className="add-category flex-col">
            <p>Category</p>
            <select name="category" value={data.category} onChange={onChangeHandler} required>
              <option value="Salad">Salad</option>
              <option value="Rolls">Rolls</option>
              <option value="Deserts">Deserts</option>
              <option value="Sandwich">Sandwich</option>
              <option value="Cake">Cake</option>
              <option value="Pure Veg">Pure Veg</option>
              <option value="Pasta">Pasta</option>
              <option value="Noodles">Noodles</option>
              <option value="Drinks">Drinks</option>
            </select>
          </div>

          <div className="add-type flex-col">
            <p>Type</p>
            <select name="type" value={data.type} onChange={onChangeHandler} required>
              <option value="normal">Normal</option>
              <option value="kebab">Kebab</option>
              <option value="combo">Combo</option>
            </select>
          </div>

          {/* <div className="add-popular flex-col">
            <label>
              <input
                type="checkbox"
                name="popular"
                checked={data.popular}
                onChange={onChangeHandler}
              /> Popular
            </label>
          </div> */}
          <div className="add-tags flex-col">
            <p>Tag</p>
            <select
              name="selectedTag"
              value={data.selectedTag}
              onChange={(e) => setData((prev) => ({ ...prev, selectedTag: e.target.value }))}
            >
              <option value="">None</option>
              <option value="popular">Popular</option>
              <option value="trending">Trending</option>
            </select>
          </div>



          <div className="add-price flex-col">
            <p>Price (€)</p>
           <input
            type="text"
            name="price"
            value={data.price}
            onChange={onChangeHandler}
            placeholder="1.50"
            step="0.01" // allows cents
            min="0"
            required
          />
          </div>
        </div>

        {/* Ingredients & Allergens */}
        <div className="add-ingredients flex-col">
          <p>Ingredients (comma separated)</p>
          <input
            type="text"
            name="ingredients"
            value={data.ingredients}
            onChange={onChangeHandler}
            placeholder="Lettuce, Tomato, Chicken"
          />
        </div>

        <div className="add-allergens flex-col">
          <p>Allergens (comma separated)</p>
          <input
            type="text"
            name="allergens"
            value={data.allergens}
            onChange={onChangeHandler}
            placeholder="Gluten, Nuts"
          />
        </div>

        <button type="submit" className="add-btn">
          ADD
        </button>
      </form>
    </div>
  );
};

export default Add;
