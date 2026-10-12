# frozen_string_literal: true

require 'sketchup'

module SkpCm
  module GridDimension
    # Grid geometry (construction lines + 3D text labels)
    module Builder
      # Draw grid lines + labels into grid_entities (all values in mm)
      def self.build(grid_entities, column_spacings, row_spacings, height_levels, label_offset_mm = 300, label_size_mm = 300, display_unit = 'mm')
        # Calculate positions from spacings
        column_positions = calculate_positions(column_spacings)
        row_positions = calculate_positions(row_spacings)
        
        # Total dimensions
        total_width = column_positions.last
        total_depth = row_positions.last
        
        # Label offset from grid edge (from config)
        label_offset = label_offset_mm.to_f.mm
        
        # Label size (from config)
        label_size = label_size_mm.to_f.mm
        
        # Grid line extension beyond boundaries
        line_extension = 150.mm
        
        # Get the base height (lowest level) for labels
        base_height = height_levels.map { |h| h.to_f.mm }.min
        
        # Create grid at base height level only using construction lines
        base_height_inch = base_height
        
        # Gap between grid line end and label
        label_gap = 250.mm
        
        # Create horizontal construction lines (X direction) - start from row label center
        row_positions.each do |y_pos|
          y = y_pos
          # Start from behind the row label (A, B, C) which is at -label_offset
          start_pt = Geom::Point3d.new(-label_offset, y, base_height_inch)
          end_pt = Geom::Point3d.new(total_width + line_extension, y, base_height_inch)
          grid_entities.add_cline(start_pt, end_pt)
        end
        
        # Create Y direction construction lines - start from column label center
        column_positions.each do |x_pos|
          x = x_pos
          # Start from behind the column label (1, 2, 3) which is at total_depth + label_offset
          start_pt = Geom::Point3d.new(x, -(label_offset - label_gap), base_height_inch)
          end_pt = Geom::Point3d.new(x, total_depth + label_offset, base_height_inch)
          grid_entities.add_cline(start_pt, end_pt)
        end
        
        # Create horizontal Y-axis construction lines at each height level (elevation guide)
        if height_levels.length > 1
          # Create horizontal lines along Y axis at each height level for the first column
          x_pos = column_positions.first
          height_levels.each do |height_mm|
            height_inch = height_mm.to_f.mm
            start_pt = Geom::Point3d.new(x_pos, -(label_offset - label_gap), height_inch)
            end_pt = Geom::Point3d.new(x_pos, total_depth + line_extension, height_inch)
            grid_entities.add_cline(start_pt, end_pt)
          end
        end
        
        # Add elevation labels at each height level (at x=0, rotated to face Left View)
        height_levels.each do |height_mm|
          height_inch = height_mm.to_f.mm
          elevation_text = format_elevation(height_mm.to_f, display_unit)
          # Position at x=0, offset in -Y direction
          elevation_pt = Geom::Point3d.new(0, -label_offset, height_inch)
          # Use special rotation for elevation labels to face Left View
          add_3d_text(grid_entities, elevation_text, elevation_pt, label_size, :elevation)
        end
        
        # Add column labels (1, 2, 3...) at the top - centered on grid line
        column_positions.each_with_index do |x_pos, col|
          label_text = (col + 1).to_s
          # Position label centered on the grid line intersection
          label_pt = Geom::Point3d.new(x_pos, total_depth + label_offset, base_height)
          add_3d_text(grid_entities, label_text, label_pt, label_size, :column_label)
        end
        
        # Add row labels (A, B, C...) at the left - centered on grid line
        row_positions.each_with_index do |y_pos, row|
          label_text = column_to_letter(row)
          # Position label centered on the grid line intersection
          label_pt = Geom::Point3d.new(-label_offset, y_pos, base_height)
          add_3d_text(grid_entities, label_text, label_pt, label_size, :row_label)
        end
      end
      
      # Calculate positions from spacings array
      def self.calculate_positions(spacings)
        positions = [0]
        spacings.each { |s| positions << positions.last + s.to_f.mm }
        positions
      end
      
      # Convert column index to letter (0 = A, 1 = B, ... 26 = AA, etc.)
      def self.column_to_letter(index)
        result = ''
        index += 1  # 1-based for calculation
        while index > 0
          index -= 1
          result = ((index % 26) + 65).chr + result
          index /= 26
        end
        result
      end
      
      # Format elevation value for display using selected unit
      def self.format_elevation(height_mm, display_unit = 'mm')
        case display_unit
        when 'm'
          meters = height_mm / 1000.0
          "EL +#{format('%.2f', meters)}m"
        when 'cm'
          cm = height_mm / 10.0
          "EL +#{format('%.1f', cm)}cm"
        else  # mm
          "EL +#{height_mm.to_i}mm"
        end
      end
      
      # Add 3D text label at specified point with optional label type
      # label_type: :normal (default, flat on XY), :elevation (rotated to face Left View),
      #             :column_label (centered for column numbers), :row_label (centered for row letters)
      def self.add_3d_text(entities, text, point, text_height = 300.mm, label_type = :normal)
        # Convert text_height if it's a number (mm value from config)
        text_height = text_height.to_f.mm if text_height.is_a?(Numeric) && text_height < 1
        text_height = text_height.mm if text_height.is_a?(Numeric) && text_height >= 1 && !text_height.is_a?(Length)
        
        text_group = entities.add_group
        text_entities = text_group.entities
        
        text_entities.add_3d_text(
          text,
          TextAlignCenter,
          'Arial',
          false,  # bold
          false,  # italic
          text_height,
          0.0,    # tolerance
          0.0,    # z (extrusion)
          true,   # filled
          0.0     # extrusion
        )
        
        # Get bounding box for centering
        bounds = text_group.bounds
        center_x = bounds.center.x
        center_y = bounds.center.y
        
        # Apply rotation and centering based on label type
        if label_type == :elevation
          # For elevation labels: rotate to face Left View (looking from -X toward +X)
          # First rotate 90° around X axis to stand up the text
          rotation_x = Geom::Transformation.rotation(ORIGIN, X_AXIS, -90.degrees)
          text_group.transform!(rotation_x)
          # Then rotate -90° around Z axis to face -X direction (Left View)
          rotation_z = Geom::Transformation.rotation(ORIGIN, Z_AXIS, -90.degrees)
          text_group.transform!(rotation_z)
          # Flip 180° around Y axis to fix upside-down
          rotation_y = Geom::Transformation.rotation(ORIGIN, Y_AXIS, 180.degrees)
          text_group.transform!(rotation_y)
        elsif label_type == :column_label
          # Center the text horizontally (X) on the point
          center_offset = Geom::Transformation.new([-center_x, -center_y, 0])
          text_group.transform!(center_offset)
        elsif label_type == :row_label
          # Center the text vertically (Y) on the point
          center_offset = Geom::Transformation.new([-center_x, -center_y, 0])
          text_group.transform!(center_offset)
        end
        
        transformation = Geom::Transformation.new(point)
        text_group.transform!(transformation)
        
        text_group
      end
    end
  end
end
