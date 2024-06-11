import {
  Add,
  AddAPhoto,
  AddCircle,
  Delete,
  Edit,
  Group,
  ManageAccounts,
  Remove,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  add_item_category,
  delete_item_category,
  edit_item_category,
  get_category_list,
} from "../../api";
import { decimalFormat, numberOnly } from "../../assets/common";

import "./style.scss";

import ReactFileReader from "react-file-reader";

import { useForm } from "react-hook-form";

import Cookies from "universal-cookie";

import EmptyCartIcon from "../../assets/img/empty-cart.png";

const cookies = new Cookies();
const categories = ["Appetizers", "Entree", "Sides", "Desserts", "Beverages"];

export const Menu = () => {
  const [displayForm, setDisplayForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [openAddItem, setOpenAddItem] = useState(false);
  const [openDeleteItem, setOpenDeleteItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryListItemMenu, setCategoryListItemMenu] = useState([]);
  const [selectedItemMenu, setSelectedItemMenu] = useState({
    name: "",
    price: "",
    quantity: "",
  });
  const [loadingList, setLoadingList] = useState(false);
  const [showAdminDialogPassword, setShowAdminDialogPassword] = useState(false);
  const [isAdminPasswordError, setIsAdminPasswordError] = useState(false);
  const [cartList, setCartList] = useState([]);
  const [showCustomerCart, setShowCustomerCart] = useState(false);
  const [cartTotalPrice, setCartTotalPrice] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [openSizeDetail, setOpenSizeDetail] = useState(false);
  const [itemSizeDetail, setItemSizeDetail] = useState({});

  const [isCheckOut, setIsCheckOut] = useState(false);

  const {
    register,
    formState: { errors },
    handleSubmit,
    clearErrors,
    resetField,
  } = useForm();

  const fetchList = async (category) => {
    setLoadingList(true);
    const list = await get_category_list(category);
    setLoadingList(false);
    setCategoryListItemMenu(list);
  };

  const handleOnChangeTextField = (e) => {
    const { value, name } = e.target;
    setSelectedItemMenu({ ...selectedItemMenu, [name]: value });
  };

  const handleSaveMenuItem = async () => {
    setIsSaving(true);
    const res =
      selectedItemMenu.id === undefined
        ? await add_item_category(selectedCategory, selectedItemMenu)
        : await edit_item_category(selectedCategory, selectedItemMenu);
    if (res === "saved") {
      setIsSaving(false);
      setOpenAddItem(false);
      fetchList(selectedCategory);
    }
  };

  const handleEditMenuItem = (obj) => {
    console.info(obj);
    setSelectedItemMenu(obj);
    setOpenAddItem(true);
  };

  const handleDeleteMenuItem = async () => {
    const res = await delete_item_category(selectedCategory, openDeleteItem.id);
    if (res === "removed") {
      fetchList(selectedCategory);
      setOpenDeleteItem(null);
    }
  };

  const handleFiles = (files) => {
    const file = files.base64;
    setSelectedItemMenu({ ...selectedItemMenu, image: file });
  };

  const handleOnSelectUserType = (type) => {
    cookies.set("user-type", type);
    setIsAdmin(type === import.meta.env.VITE_USER_TYPE_1);
    setDisplayForm(true);
  };

  const handleCheckAdminPassword = () => {
    const adminPass = document.querySelector("#admin-password-field").value;

    if (adminPass === "admin123") {
      cookies.set("user-type", import.meta.env.VITE_USER_TYPE_1);
      setIsAdmin(true);
      setShowAdminDialogPassword(false);
      setDisplayForm(true);
    } else {
      setIsAdminPasswordError(true);
    }
  };

  const handleCloseAdminPasswordDialog = () => {
    setShowAdminDialogPassword(false);
  };

  const handleAddToCart = (item) => {
    const category = selectedCategory.toLowerCase();
    if (category !== "sides" && category !== "beverages") {
      item.count = 1;
      item.totalPrice = item.price;
      setCartList([...cartList, item]);
    } else {
      item.size = "small";
      item.additional = 0;
      setItemSizeDetail(item);
      setOpenSizeDetail(true);
    }
  };

  const handleAddToCartWithSize = () => {
    const item = { ...itemSizeDetail };
    item.count = 1;
    item.origPrice = item.price;
    item.totalPrice = item.price;
    setCartList([...cartList, item]);
    setItemSizeDetail({});
    setOpenSizeDetail(false);
  };

  const getCartItemQuantity = (id) => {
    const item = cartList.find((n) => n.id === id);
    return item ? item.count : 0;
  };

  const handleAddLessItem = (id, action) => {
    const list = [...cartList];
    const item = list.find((n) => n.id === id);

    switch (action) {
      case "add":
        item.count = item.count + 1;
        break;
      case "less":
        item.count = item.count === 1 ? 1 : item.count - 1;
        break;
      default:
        break;
    }

    item.totalPrice = item.count * parseFloat(item.price);
    setCartList(list);
  };

  const handleRemoveItem = (id) => {
    const list = [...cartList];
    const itemIndex = list.findIndex((n) => n.id === id);
    list.splice(itemIndex, 1);
    setCartList(list);
  };

  const handleGetAdditional = (size) => {
    let additional = 0;
    switch (size) {
      case "medium":
        additional = 50;
        break;
      case "large":
        additional = 100;
        break;
      default:
        break;
    }

    return additional;
  };

  const handleSelectItemSize = (size) => {
    const item = { ...itemSizeDetail };
    const itemList = categoryListItemMenu.find((n) => n.id === item.id);
    const additional = handleGetAdditional(size);

    item.size = size;
    item.additional = additional;

    // modify price
    item.price = parseFloat(itemList.price) + additional;

    setItemSizeDetail(item);
  };

  const handleChangeItemSize = (id, e) => {
    const newCartItemList = [...cartList];
    const size = e.target.value;
    const additional = handleGetAdditional(size);
    const cartItem = newCartItemList.find((n) => n.id === id);
    const newPrice = parseFloat(cartItem.origPrice) + additional;

    cartItem.size = size;
    cartItem.additional = additional;
    cartItem.price = newPrice;
    cartItem.totalPrice = newPrice * cartItem.count;

    setCartList(newCartItemList);
    console.info(newCartItemList);
  };

  const handleCheckOutCart = () => {
    setIsCheckOut(cartList.length !== 0);
  };

  const generateRandomNumber = () => {
    let orderNumber = "";
    for (let i = 0; i < 4; i++) {
      orderNumber += Math.floor(Math.random() * 10);
    }
    return orderNumber;
  };

  const handleCloseCart = () => {
    setCartList([]);
    setIsCheckOut(false);
    setShowCustomerCart(false);
  };

  useLayoutEffect(() => {
    const userType = cookies.get("user-type");
    if (userType) {
      setIsAdmin(userType === import.meta.env.VITE_USER_TYPE_1);
      setDisplayForm(true);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setLoadingList(true);
      setCategoryListItemMenu([]);
      fetchList(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (openAddItem === false) {
      setTimeout(() => {
        setSelectedItemMenu({
          name: "",
          price: "",
          quantity: "",
        });
        if (Object.keys(errors).length !== 0) clearErrors(errors);
        resetField("name");
        resetField("price");
        resetField("quantity");
      }, 500);
    }
  }, [openAddItem]);

  useEffect(() => {
    let price = 0;
    if (cartList.length !== 0) {
      cartList.forEach((item) => {
        price = parseFloat(item.totalPrice) + price;
      });
    }
    setCartTotalPrice(price);
  }, [cartList]);

  return (
    <>
      {displayForm ? (
        <Paper elevation={5} classes={{ root: "menu-paper" }}>
          <Box className="menu-navigation">
            <Box>
              <Typography variant="h3" classes={{ root: "header-title" }}>
                Menu
              </Typography>
              <Box className="menu-list">
                {categories.map((item, key) => (
                  <Box
                    className={`menu-list_item ${
                      selectedCategory === item ? "active" : ""
                    }`}
                    key={key}
                    onClick={() => setSelectedCategory(item)}
                  >
                    {item}
                  </Box>
                ))}
              </Box>
            </Box>
            {isAdmin === false && (
              <Box className="customer-cart">
                <Button
                  variant="outlined"
                  disableElevation
                  onClick={() => setShowCustomerCart(true)}
                  fullWidth
                >
                  {`Checkout (${cartList.length})`}
                </Button>
              </Box>
            )}
          </Box>
          {selectedCategory ? (
            <Box className="category">
              <Box className="category_header">
                <Typography variant="h3" classes={{ root: "header-title" }}>
                  {selectedCategory}
                </Typography>
                <Box className="header-btn">
                  {isAdmin && (
                    <Button
                      endIcon={<AddCircle />}
                      variant="contained"
                      className="add-item"
                      disableElevation
                      onClick={() => setOpenAddItem(true)}
                    >
                      Add Item
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    className="add-item"
                    disableElevation
                    onClick={() => {
                      setSelectedCategory(null);
                      setDisplayForm(false);
                    }}
                  >
                    Change User
                  </Button>
                </Box>
              </Box>
              <Divider />
              {categoryListItemMenu.length !== 0 ? (
                <Box className="category_item-list">
                  {categoryListItemMenu.map((item, key) => (
                    <Box key={key} className="category_item-list_item">
                      <img src={item.image} alt={item.name} className="image" />
                      <Box className="details">
                        <Typography variant="h6" className="title">
                          {item.name}
                        </Typography>
                        <Box className="price">
                          <Typography variant="subtitle1">Price:</Typography>
                          <Typography variant="subtitle2">
                            &#8369; {item.price}
                          </Typography>
                        </Box>
                        <Box className="quantity">
                          <Typography variant="subtitle1">In Stock:</Typography>
                          <Typography variant="subtitle2">
                            {item.quantity}
                          </Typography>
                        </Box>
                        {isAdmin ? (
                          <Box className="admin-actions">
                            <Button
                              variant="contained"
                              className="btn-edit"
                              disableElevation
                              onClick={() => handleEditMenuItem(item)}
                            >
                              <Edit />
                            </Button>
                            <Button
                              variant="contained"
                              className="btn-delete"
                              disableElevation
                              onClick={() => setOpenDeleteItem(item)}
                            >
                              <Delete />
                            </Button>
                          </Box>
                        ) : (
                          <Button
                            variant="contained"
                            className="add-to-cart"
                            disableElevation
                            onClick={() => handleAddToCart(item)}
                          >
                            {`Add to cart ${
                              getCartItemQuantity(item.id) !== 0
                                ? `(${getCartItemQuantity(item.id)})`
                                : ""
                            }`}
                          </Button>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box className="empty-list">
                  {loadingList ? (
                    <CircularProgress />
                  ) : (
                    <Typography variant="h6">No Menu</Typography>
                  )}
                </Box>
              )}
            </Box>
          ) : (
            <Box className="no-selected-category">
              <Typography variant="h6">No selected category</Typography>
            </Box>
          )}
        </Paper>
      ) : (
        showAdminDialogPassword === false && (
          <Paper elevation={5} classes={{ root: "menu-paper-user-selector" }}>
            <Typography variant="h6">Select user type:</Typography>
            <Box className="user-selector-btn-cont">
              <Button
                startIcon={<Group />}
                className="user-selector-btn"
                onClick={() =>
                  handleOnSelectUserType(import.meta.env.VITE_USER_TYPE_2)
                }
              >
                {import.meta.env.VITE_USER_TYPE_2}
              </Button>
              <Button
                startIcon={<ManageAccounts />}
                className="user-selector-btn"
                onClick={() => {
                  setShowAdminDialogPassword(true);
                }}
              >
                {import.meta.env.VITE_USER_TYPE_1}
              </Button>
            </Box>
          </Paper>
        )
      )}

      <Dialog open={openAddItem} classes={{ paper: "add-item-dialog" }}>
        <DialogTitle classes={{ root: "add-item-dialog_header" }}>
          {`Add ${selectedCategory}`}
        </DialogTitle>
        <DialogContent classes={{ root: "add-item-dialog_content" }}>
          <Box className="item-field">
            <Typography variant="subtitle1" className="label">
              Image:
            </Typography>
            <Box className="image-selector-cont">
              <ReactFileReader
                fileTypes={[".jpg", ".jpeg", ".png"]}
                base64={true}
                multipleFiles={false}
                handleFiles={handleFiles}
              >
                {selectedItemMenu.image ? (
                  <>
                    <img
                      src={selectedItemMenu.image}
                      alt={selectedItemMenu.name}
                      className="preview-image"
                    />
                    <Box className="backdrop">
                      <Edit />
                      <Typography variant="subtitle" className="hint">
                        Change Image
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Box className="empty-image">
                    <AddAPhoto />
                    <Typography variant="subtitle" className="hint">
                      Click to add image
                    </Typography>
                  </Box>
                )}
              </ReactFileReader>
            </Box>
          </Box>

          <form onSubmit={handleSubmit(handleSaveMenuItem)}>
            <Box className="item-field">
              <Typography variant="subtitle1" className="label">
                Name:
              </Typography>
              <TextField
                autoComplete="off"
                fullWidth
                className="text-field"
                name="name"
                value={selectedItemMenu.name}
                onChange={handleOnChangeTextField}
                inputProps={{ ...register("name", { required: true }) }}
              />
              {errors.name?.type === "required" && (
                <p role="alert">Name is required</p>
              )}
            </Box>

            <Box className="item-field">
              <Typography variant="subtitle1" className="label">
                Price:
              </Typography>
              <TextField
                autoComplete="off"
                fullWidth
                className="text-field"
                onKeyDown={decimalFormat}
                onBlur={(e) => {
                  e.target.value = parseFloat(e.target.value).toFixed(2);
                }}
                name="price"
                value={selectedItemMenu.price}
                onChange={handleOnChangeTextField}
                inputProps={{ ...register("price", { required: true }) }}
              />
              {errors.price?.type === "required" && (
                <p role="alert">Price is required</p>
              )}
            </Box>
            <input type="submit" id="btn-form-submit" />
          </form>

          <Box className="item-field">
            <Typography variant="subtitle1" className="label">
              Quantity:
            </Typography>
            <TextField
              autoComplete="off"
              fullWidth
              className="text-field"
              onKeyDown={numberOnly}
              name="quantity"
              value={selectedItemMenu.quantity}
              onChange={handleOnChangeTextField}
            />
          </Box>
        </DialogContent>
        <DialogActions classes={{ root: "add-item-dialog_actions" }}>
          <Button
            variant="outlined"
            disableElevation
            onClick={() => setOpenAddItem(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={() => {
              document.querySelector("#btn-form-submit").click();
            }}
          >
            {isSaving ? (
              <CircularProgress size={15} />
            ) : selectedItemMenu.id ? (
              "Update"
            ) : (
              "Save"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(openDeleteItem)}
        classes={{ paper: "add-item-dialog" }}
      >
        <DialogTitle>Confirmation</DialogTitle>
        <DialogContent>
          {`Are you sure you want to delete ${
            openDeleteItem ? openDeleteItem.name : ""
          }?`}
        </DialogContent>
        <DialogActions classes={{ root: "add-item-dialog_actions" }}>
          <Button
            variant="outlined"
            disableElevation
            onClick={() => setOpenDeleteItem(null)}
          >
            No
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleDeleteMenuItem}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showAdminDialogPassword}
        classes={{ paper: "admin-password" }}
        onClose={handleCloseAdminPasswordDialog}
      >
        <DialogTitle>Enter password</DialogTitle>
        <DialogContent>
          <TextField
            id="admin-password-field"
            className="text-field"
            fullWidth
            type="password"
            error={isAdminPasswordError}
            helperText={isAdminPasswordError ? "Invalid password" : ""}
            onFocus={() => {
              setIsAdminPasswordError(false);
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                handleCheckAdminPassword();
              }
            }}
          />
        </DialogContent>
        <DialogActions classes={{ root: "admin-password_actions" }}>
          <Button
            variant="contained"
            disableElevation
            onClick={handleCheckAdminPassword}
            fullWidth
          >
            Enter
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showCustomerCart}
        classes={{ paper: "cart-dialog" }}
        onClose={() => setShowCustomerCart(false)}
      >
        <DialogTitle>{isCheckOut ? "" : "Your Cart"}</DialogTitle>
        <DialogContent classes={{ root: "cart-dialog_content" }}>
          {isCheckOut === false ? (
            cartList.length !== 0 ? (
              <TableContainer className="menu-table">
                <Table>
                  <TableBody>
                    {cartList.map((item, key) => (
                      <TableRow key={key} className="cart-item">
                        <TableCell className="image">
                          <img src={item.image} alt={item.name} />
                        </TableCell>
                        <TableCell className="name" align="center">
                          {item.name}
                        </TableCell>

                        <TableCell className="quantity-size-cell">
                          <Box className="item-quantity-input">
                            <Box className="quantity">
                              <IconButton
                                onClick={() =>
                                  handleAddLessItem(item.id, "add")
                                }
                              >
                                <Add />
                              </IconButton>
                              <TextField
                                className="text-field"
                                value={item.count}
                              />
                              <IconButton
                                onClick={() =>
                                  handleAddLessItem(item.id, "less")
                                }
                              >
                                <Remove />
                              </IconButton>
                            </Box>
                            {item.size && (
                              <Select
                                value={item.size}
                                onChange={(e) =>
                                  handleChangeItemSize(item.id, e)
                                }
                              >
                                <MenuItem value="small">Small</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="large">Large</MenuItem>
                              </Select>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell className="price" align="right">
                          {item.totalPrice}
                        </TableCell>
                        <TableCell className="item-action" align="right">
                          <Button
                            className="remove-item-btn"
                            variant="contained"
                            disableElevation
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Delete />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box className="empty-cart">
                <img src={EmptyCartIcon} alt="Empty cart" />
                <Typography variant="h4">Your cart is empty</Typography>
              </Box>
            )
          ) : (
            <Box className="checkout-details">
              <Typography variant="h5" textAlign="center">
                Your order is being prepared.
              </Typography>
              <Typography variant="h6" textAlign="center">
                {`Please pay ₱ ${cartTotalPrice.toLocaleString()} at the cashier.`}
              </Typography>
              <Typography variant="h4" textAlign="center">
                Your order number is
              </Typography>
              <Typography variant="h3" textAlign="center">
                {generateRandomNumber()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          classes={{ root: `cart-dialog_actions ${isCheckOut && "checkout"}` }}
        >
          {isCheckOut === false ? (
            <>
              <Typography
                variant="h5"
                className="total-price"
              >{`Your total is ₱ ${cartTotalPrice}`}</Typography>
              <Button
                variant="contained"
                disableElevation
                onClick={handleCheckOutCart}
                fullWidth
              >
                Checkout
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              disableElevation
              onClick={handleCloseCart}
              fullWidth
            >
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={openSizeDetail}
        classes={{ paper: "size-dialog" }}
        onClose={() => setOpenSizeDetail(false)}
      >
        <DialogTitle>Choose size</DialogTitle>
        <DialogContent classes={{ root: "size-dialog_content" }}>
          <Box className="image-size-preview">
            <img src={itemSizeDetail.image} alt={itemSizeDetail.name} />
          </Box>
          <Box className="additional">
            <Typography variant="subtitle1">Additional:</Typography>
            <Typography variant="h6">
              {itemSizeDetail.additional || 0}
            </Typography>
          </Box>
          <Box className="orig-price">
            <Typography variant="subtitle1">Price:</Typography>
            <Typography variant="h6">{itemSizeDetail.price}</Typography>
          </Box>
        </DialogContent>
        <DialogActions classes={{ root: "size-dialog_actions" }}>
          <Box className="size-cont">
            <Button
              variant="outlined"
              fullWidth
              className={`${
                itemSizeDetail.size === "small" && "selected-size"
              }`}
              onClick={() => handleSelectItemSize("small")}
            >
              S
            </Button>
            <Button
              variant="outlined"
              fullWidth
              className={`${
                itemSizeDetail.size === "medium" && "selected-size"
              }`}
              onClick={() => handleSelectItemSize("medium")}
            >
              M
            </Button>
            <Button
              variant="outlined"
              fullWidth
              className={`${
                itemSizeDetail.size === "large" && "selected-size"
              }`}
              onClick={() => handleSelectItemSize("large")}
            >
              L
            </Button>
          </Box>
          <Button
            variant="contained"
            disableElevation
            onClick={handleAddToCartWithSize}
            fullWidth
          >
            Add to cart
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
