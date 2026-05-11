"""Fusion 360 seed for the v2 osteocyte flow chamber.

This script creates a fresh Fusion design with:
    1. the locked CAD user-parameter table;
    2. one physical body: the Thorlabs CG15KH1 cover glass.

Everything else should be modeled manually around that datum.

Coordinate convention:
    X = flow direction / 50 mm cover-glass length
    Y = cover-glass width
    Z = optical stack height

The fluid-facing cell surface of the cover glass is placed on Z = 0. The glass
body extends downward to Z = -cover_glass_t, toward the inverted objective.
"""

import traceback

import adsk.core
import adsk.fusion


MM_PER_CM = 10.0


# Geometry parameters only. Non-geometric decisions such as material, thread
# class, and substrate strategy remain documented in the Markdown design lock.
PARAMETERS = (
    # Optical substrate / locked procurement reference.
    ("cover_glass_l", "50.0 mm", "Thorlabs CG15KH1 nominal cover glass length"),
    ("cover_glass_w", "24.0 mm", "Thorlabs CG15KH1 nominal cover glass width"),
    ("cover_glass_t", "0.170 mm", "Thorlabs CG15KH1 nominal cover glass thickness"),
    ("cover_glass_xy_tol", "0.2 mm", "Manufacturer length/width tolerance from drawing"),
    ("cover_glass_t_tol", "0.005 mm", "Manufacturer thickness tolerance from drawing"),
    ("cover_glass_pocket_l", "50.8 mm", "Prototype pocket length for sterile drop-in placement"),
    ("cover_glass_pocket_w", "24.8 mm", "Prototype pocket width for sterile drop-in placement"),
    ("cover_glass_pocket_corner_r", "0.5 mm", "Prototype internal corner radius"),
    ("cover_glass_pocket_chamfer", "0.25 mm", "Small lead-in chamfer for easier coverslip placement"),

    # Locked flow channel — matches the full Thorlabs CG15KH1 cover-glass footprint.
    ("channel_l", "50.0 mm", "Locked active channel length (matches full cover-glass length)"),
    ("channel_w", "24.0 mm", "Locked parallel-plate channel width (matches full cover-glass width)"),
    ("channel_h", "0.25 mm", "Locked channel height; hard-stop controlled"),
    ("imaging_w", "3.0 mm", "Preferred central near-uniform shear imaging width (LSM 880 40x FOV)"),
    ("developed_entry_l", "1.0 mm", "Analytical entrance length is well under 1 mm at canonical Re; whole channel is fully developed"),
    ("manifold_l", "4.0 mm", "Nominal shallow end-manifold length at each luer bore"),
    ("manifold_w", "6.0 mm", "Nominal shallow end-manifold width at each luer bore"),
    ("manifold_h", "0.75 mm", "Nominal shallow end-manifold depth before the thin channel"),
    ("manifold_transition_l", "4.0 mm", "Nominal taper/fillet transition into the 24 mm x 0.25 mm channel"),

    # Seal / hard-stop stack. The O-ring seals; steel-to-steel contact sets repeatability.
    ("cover_glass_t_measured", "cover_glass_t", "Measured lot thickness when available"),
    ("boss_stack_depth", "cover_glass_t_measured + channel_h", "Pocket/boss Z stack from glass support datum to channel ceiling"),
    ("o_ring_gland_clearance", "0.0 mm", "Placeholder until O-ring cross-section and gland are chosen"),
    ("seal_land_min_w", "2.0 mm", "Initial minimum seal/support land width around flow path"),

    # Reusable chamber envelope placeholders.
    ("body_l", "80.0 mm", "Initial reusable chamber body length envelope"),
    ("body_w", "52.0 mm", "Initial reusable chamber body width envelope"),
    ("body_t", "12.0 mm", "Initial reusable chamber body thickness envelope"),
    ("bottom_lip_t", "0.75 mm", "Minimum vertical thickness for objective-side glass support lip"),
    ("objective_window_l", "46.0 mm", "Initial objective-side opening along flow"),
    ("objective_window_w", "23.0 mm", "Initial objective-side opening width"),

    # Objective / stage clearance references.
    ("objective_ref_d", "18.8629 mm", "Measured objective / nose reference diameter"),
    ("objective_ref_h", "45.0877 mm", "Measured objective / nose reference height"),
    ("objective_clearance_radial", "2.0 mm", "Minimum radial clearance around measured objective reference"),
    ("objective_envelope_d", "objective_ref_d + 2 * objective_clearance_radial", "Objective clearance envelope diameter"),
    ("holder_plate_l", "175.0652 mm", "Measured holder plate reference envelope length"),
    ("holder_plate_w", "105.1809 mm", "Measured holder plate reference envelope width"),
    ("holder_plate_t", "5.0 mm", "Measured holder plate reference envelope thickness"),

    # Luer port / tubing layout references.
    ("luer_bore_d", "2.0 mm", "Nominal luer bore into end manifold; verify against vendor STEP"),
    ("luer_socket_clearance_d", "16.0 mm", "Initial keep-out diameter around top-mounted luer socket/plug"),
    ("luer_socket_spacing_min", "20.0 mm", "Initial minimum center spacing for finger access"),
    ("tube_od", "1.5875 mm", "1/16 inch OD tubing after luer adapter"),

    # Clamp / fastener references.
    ("m3_clearance_d", "3.4 mm", "Reference M3 clearance hole"),
    ("m3_head_clearance_d", "5.8 mm", "Reference M3 socket-head clearance diameter"),
    ("m3_thread_pilot_d", "2.5 mm", "Reference M3 tapped pilot diameter"),
    ("fastener_to_glass_edge_min", "3.0 mm", "Initial minimum fastener clearance from glass edge"),
    ("tool_clearance_near_objective", "5.0 mm", "Minimum clearance around fittings or screw heads near objective zone"),
)


def mm(value):
    """Convert millimeters to Fusion database units, centimeters."""
    return float(value) / MM_PER_CM


def value_expr(expression):
    return adsk.core.ValueInput.createByString(expression)


def ensure_user_parameters(design):
    params = design.userParameters
    for name, expression, comment in PARAMETERS:
        existing = params.itemByName(name)
        if existing:
            existing.expression = expression
            existing.comment = comment
        else:
            params.add(name, value_expr(expression), "mm", comment)


def create_cover_glass_body(design):
    root = design.rootComponent

    plane_input = root.constructionPlanes.createInput()
    plane_input.setByOffset(root.xYConstructionPlane, value_expr("-cover_glass_t"))
    base_plane = root.constructionPlanes.add(plane_input)
    base_plane.name = "cover_glass_bottom_plane_Z_minus_cover_glass_t"

    sketch = root.sketches.add(base_plane)
    sketch.name = "CG15KH1_cover_glass_centered_profile"

    half_l = mm(50.0) / 2.0
    half_w = mm(24.0) / 2.0
    p1 = adsk.core.Point3D.create(-half_l, -half_w, 0)
    p2 = adsk.core.Point3D.create(half_l, half_w, 0)
    rect_lines = sketch.sketchCurves.sketchLines.addTwoPointRectangle(p1, p2)

    horizontal = []
    vertical = []
    for index in range(rect_lines.count):
        line = rect_lines.item(index)
        start = line.startSketchPoint.geometry
        end = line.endSketchPoint.geometry
        dx = abs(end.x - start.x)
        dy = abs(end.y - start.y)
        if dx >= dy:
            horizontal.append(line)
        else:
            vertical.append(line)

    bottom = min(horizontal, key=lambda line: (line.startSketchPoint.geometry.y + line.endSketchPoint.geometry.y) / 2.0)
    left = min(vertical, key=lambda line: (line.startSketchPoint.geometry.x + line.endSketchPoint.geometry.x) / 2.0)

    dims = sketch.sketchDimensions
    length_dim = dims.addDistanceDimension(
        bottom.startSketchPoint,
        bottom.endSketchPoint,
        adsk.fusion.DimensionOrientations.HorizontalDimensionOrientation,
        adsk.core.Point3D.create(0, -half_w - mm(4.0), 0),
    )
    length_dim.parameter.expression = "cover_glass_l"

    width_dim = dims.addDistanceDimension(
        left.startSketchPoint,
        left.endSketchPoint,
        adsk.fusion.DimensionOrientations.VerticalDimensionOrientation,
        adsk.core.Point3D.create(-half_l - mm(4.0), 0, 0),
    )
    width_dim.parameter.expression = "cover_glass_w"

    extrudes = root.features.extrudeFeatures
    ext_input = extrudes.createInput(sketch.profiles.item(0), adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    ext_input.setDistanceExtent(False, value_expr("cover_glass_t"))
    ext = extrudes.add(ext_input)
    body = ext.bodies.item(0)
    body.name = "CG15KH1_24x50x0p170_cover_glass"

    appearance = design.appearances.itemByName("Glass - Clear") or design.appearances.itemByName("Glass")
    if appearance:
        body.appearance = appearance


def run(context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface

        app.documents.add(adsk.core.DocumentTypes.FusionDesignDocumentType)
        design = adsk.fusion.Design.cast(app.activeProduct)
        design.designType = adsk.fusion.DesignTypes.ParametricDesignType

        ensure_user_parameters(design)
        create_cover_glass_body(design)

        ui.messageBox(
            "Created v2 seed with parameters and one cover-glass body.\n\n"
            "Datum: fluid-facing cell surface is Z = 0; glass extends downward "
            "to Z = -cover_glass_t."
        )
    except Exception:
        if ui:
            ui.messageBox("Fusion seed script failed:\n{}".format(traceback.format_exc()))
