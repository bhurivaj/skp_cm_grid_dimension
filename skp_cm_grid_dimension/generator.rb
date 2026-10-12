# frozen_string_literal: true

require 'sketchup'
require 'json'
require_relative 'builder'

module SkpCm
  module GridDimension
    module Generator
      DIALOG_TITLE = 'Grid Dimension Tool'
      DIALOG_WIDTH = 400
      DIALOG_HEIGHT = 650
      TAG_NAME = 'Grid'
      # Dialog config saved on each grid group so it can be edited later
      ATTR_DICT = 'skp_cm_grid_dimension'
      ATTR_CONFIG = 'config'

      @dialog = nil
      @edit_group = nil

      class << self
        attr_accessor :dialog
      end

      # edit_group: grid group to edit (nil = create a new grid)
      def self.show_dialog(edit_group = nil)
        if @dialog && @dialog.visible?
          if edit_group
            @edit_group = edit_group
            send_edit_config
          end
          @dialog.bring_to_front
          return
        end

        @edit_group = edit_group
        html_path = File.join(File.dirname(__FILE__), 'grid_dialog.html')

        @dialog = UI::HtmlDialog.new(
          dialog_title: DIALOG_TITLE,
          preferences_key: 'skp_cm_grid_dimension_dialog',
          width: DIALOG_WIDTH,
          height: DIALOG_HEIGHT,
          resizable: true,
          style: UI::HtmlDialog::STYLE_DIALOG
        )

        @dialog.set_file(html_path)

        # Register callbacks
        @dialog.add_action_callback('dialog_ready') do |_action_context|
          send_edit_config
        end

        @dialog.add_action_callback('generate_grid') do |_action_context, json_config|
          generate_grid(json_config)
        end

        @dialog.add_action_callback('close_dialog') do |_action_context|
          @dialog.close
        end

        @dialog.set_on_closed { @edit_group = nil }

        @dialog.show
      end

      # Grid group in the current selection (only grids that have saved config)
      def self.selected_grid
        model = Sketchup.active_model
        return nil unless model

        sel = model.selection
        return nil unless sel.length == 1

        entity = sel.first
        return nil unless entity.is_a?(Sketchup::Group)
        return nil unless entity.get_attribute(ATTR_DICT, ATTR_CONFIG)

        entity
      end

      def self.edit_group_valid?
        @edit_group && @edit_group.valid? && @edit_group.model == Sketchup.active_model
      end

      def self.send_edit_config
        return unless @dialog
        return unless edit_group_valid?

        json = @edit_group.get_attribute(ATTR_DICT, ATTR_CONFIG)
        return unless json

        @dialog.execute_script("loadConfig(#{json})")
      end

      def self.grid_tag(model)
        model.layers[TAG_NAME] || model.layers.add(TAG_NAME)
      end

      def self.generate_grid(json_config)
        begin
          config = JSON.parse(json_config)

          grid_type = config['gridType'] || 'uniform'
          columns = config['columns'].to_i
          rows = config['rows'].to_i
          height_levels = config['heightLevels'] || [0]

          # Get spacings based on mode
          if grid_type == 'variable'
            column_spacings = config['columnSpacings'] || []
            row_spacings = config['rowSpacings'] || []

            return UI.messagebox('กรุณาระบุระยะห่างคอลัมน์') if column_spacings.empty?
            return UI.messagebox('กรุณาระบุระยะห่างแถว') if row_spacings.empty?
          else
            spacing_x = config['spacingX'].to_f
            spacing_y = config['spacingY'].to_f

            return UI.messagebox('กรุณาระบุระยะห่างที่ถูกต้อง') if spacing_x <= 0 || spacing_y <= 0

            column_spacings = Array.new(columns, spacing_x)
            row_spacings = Array.new(rows, spacing_y)
          end

          # Validate inputs
          return UI.messagebox('กรุณาระบุจำนวนคอลัมน์และแถวที่ถูกต้อง') if columns < 1 || rows < 1

          model = Sketchup.active_model
          return UI.messagebox('ไม่พบโมเดลที่ใช้งานอยู่') unless model

          updating = edit_group_valid?

          # Start operation
          model.start_operation(updating ? 'Update Grid' : 'Create Grid', true)

          begin
            if updating
              grid_group = @edit_group
              # Copies of a group share one definition — edit only this one
              grid_group.make_unique
              grid_group.entities.clear!
            else
              grid_group = model.active_entities.add_group
            end

            label_offset = config['labelOffset'] || 300
            label_size = config['labelSize'] || 300
            display_unit = config['displayUnit'] || 'mm'
            Builder.build(grid_group.entities, column_spacings, row_spacings, height_levels, label_offset, label_size, display_unit)

            grid_group.name = "Grid_#{columns}x#{rows}_#{height_levels.length}levels"
            grid_group.layer = grid_tag(model)
            grid_group.set_attribute(ATTR_DICT, ATTR_CONFIG, json_config)
            model.commit_operation

            total_width = column_spacings.sum
            total_depth = row_spacings.sum
            title = updating ? 'อัปเดต Grid สำเร็จ!' : 'สร้าง Grid สำเร็จ!'
            UI.messagebox("#{title}\n• #{columns} คอลัมน์ x #{rows} แถว\n• #{height_levels.length} ระดับความสูง\n• ขนาด: #{format_dimension(total_width)} × #{format_dimension(total_depth)}")
            @dialog.close if @dialog
          rescue => e
            model.abort_operation
            UI.messagebox("เกิดข้อผิดพลาด: #{e.message}")
          end

        rescue JSON::ParserError => e
          UI.messagebox("ข้อมูลไม่ถูกต้อง: #{e.message}")
        end
      end

      def self.format_dimension(mm_value)
        if mm_value >= 1000
          "#{(mm_value / 1000.0).round(2)}m"
        else
          "#{mm_value.round(0)}mm"
        end
      end
    end
  end
end
